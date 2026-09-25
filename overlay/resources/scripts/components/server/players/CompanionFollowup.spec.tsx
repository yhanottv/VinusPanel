/** @jest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import PlayerCompanionPrompt from './PlayerCompanionPrompt';
import { activateCompanion, queueCompanion, pendingCompanion, dismissCompanion } from './companionFollowup';
const mockGet=jest.fn(),mockPost=jest.fn(),mockStats=jest.fn();
let mockStatus='offline',mockAllowed=true;
// jsdom has no viewport intersection API; Headless UI uses it only to observe the dialog.
beforeAll(()=>{Object.defineProperty(window,'IntersectionObserver',{configurable:true,value:class { observe() {} unobserve() {} disconnect() {} }});});
afterAll(()=>{delete (window as any).IntersectionObserver;});
jest.mock('@/api/http',()=>({__esModule:true,default:{get:(...a:any[])=>mockGet(...a),post:(...a:any[])=>mockPost(...a)},httpErrorToHuman:()=> 'Request failed'}));
jest.mock('@/api/server/getServerResourceUsage',()=>({__esModule:true,default:(...a:any[])=>mockStats(...a)}));
jest.mock('@/state/server',()=>({ServerContext:{useStoreState:(fn:any)=>fn({server:{data:{uuid:'server',id:'s'}},status:{value:mockStatus}})}}));
jest.mock('easy-peasy',()=>({useStoreState:(fn:any)=>fn({user:{data:{uuid:'user'}}})}));
jest.mock('@/plugins/usePermissions',()=>({usePermissions:(p:string[])=>p.map(()=>mockAllowed)}));
jest.mock('@/designRuntime',()=>({designPreview:false}));
jest.mock('@/locales/translate',()=>({vt:(s:string)=>s}));
jest.mock('@/components/elements/dialog',()=>({Dialog:({open,children,title,onClose}:any)=>open?<div role="dialog"><h2>{title}</h2><button onClick={onClose}>Close</button>{children}</div>:null}));
jest.mock('@/components/MessageBox',()=>({__esModule:true,default:({children}:any)=><aside>{children}</aside>}));
jest.mock('react-router-dom',()=>({Link:({children,...props}:any)=><a {...props}>{children}</a>}));
beforeEach(()=>{localStorage.clear();mockStatus='offline';mockAllowed=true;mockGet.mockReset();mockPost.mockReset();mockStats.mockReset();mockGet.mockResolvedValue({data:{supported:true,can_install:true,kind:'mod',read_only:true,software:'forge',minecraft:'1.20.1'}});mockPost.mockResolvedValue({data:{status:'installed'}});mockStats.mockResolvedValue({status:'offline'});});
afterEach(()=>{cleanup();jest.useRealTimers();});
it('waits for running status and Later never sends a mutation',async()=>{
 queueCompanion('user','server');const view=render(<PlayerCompanionPrompt/>);expect(screen.queryByRole('dialog')).toBeNull();expect(mockGet.mock.calls.every(c=>c[0].endsWith('/followup'))).toBe(true);
 mockStatus='starting';view.rerender(<PlayerCompanionPrompt/>);expect(screen.queryByRole('dialog')).toBeNull();
 mockStatus='running';view.rerender(<PlayerCompanionPrompt/>);await screen.findByText('Mod compatible',{exact:false});
 fireEvent.click(screen.getByRole('button',{name:'Plus tard'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(pendingCompanion('user','server')).toBeNull();expect(mockPost.mock.calls.every(c=>c[0].endsWith('/followup/dismiss'))).toBe(true);
});
it('keeps pending offers scoped to the user/server, survives remount and does not clear newer installs',()=>{
 queueCompanion('user','server');const first=pendingCompanion('user','server')!;expect(pendingCompanion('another','server')).toBeNull();expect(pendingCompanion('user','other')).toBeNull();
 queueCompanion('user','server');dismissCompanion('user','server',first);expect(pendingCompanion('user','server')).not.toBeNull();
});
it('does not offer power actions without permissions',async()=>{
 mockAllowed=false;mockStatus='running';queueCompanion('user','server');render(<PlayerCompanionPrompt/>);await screen.findByText(/Un administrateur disposant/);expect(screen.queryByRole('button',{name:'Arrêter, installer et redémarrer'})).toBeNull();expect(mockPost).not.toHaveBeenCalled();
});
it('keeps unsupported targets informational without stopping the server',async()=>{
 mockGet.mockResolvedValue({data:{supported:false,can_install:true,read_only:true}});mockStatus='running';queueCompanion('user','server');render(<PlayerCompanionPrompt/>);await screen.findByText(/Cette version peut être utilisée/);expect(mockPost).not.toHaveBeenCalled();
});
it('stops gracefully, waits for offline, installs and only then requests start',async()=>{
 jest.useFakeTimers();mockStats.mockResolvedValueOnce({status:'running'}).mockResolvedValueOnce({status:'stopping'}).mockResolvedValueOnce({status:'offline'});
 const stage=jest.fn();const promise=activateCompanion('server',stage);await act(async()=>{await Promise.resolve();await Promise.resolve();});
 expect(mockPost).toHaveBeenCalledWith('/api/client/servers/server/power',{signal:'stop'});expect(mockPost).toHaveBeenCalledTimes(1);
 await act(async()=>{jest.advanceTimersByTime(1500);await Promise.resolve();});expect(mockPost).toHaveBeenCalledTimes(1);
 await act(async()=>{jest.advanceTimersByTime(1500);await promise;});
 expect(mockPost.mock.calls.map(c=>c[1])).toEqual([{signal:'stop'},{},{signal:'start'}]);
 expect(stage.mock.calls.map(c=>c[0])).toEqual(['checking','stopping','installing','starting','done']);
});
it('never starts after a failed companion upload',async()=>{
 mockPost.mockRejectedValueOnce(new Error('upload failed'));await expect(activateCompanion('server',()=>{})).rejects.toThrow('upload failed');expect(mockPost).toHaveBeenCalledTimes(1);
});
it('preserves an existing bridge and leaves it stopped for compatibility review',async()=>{
 mockPost.mockResolvedValueOnce({data:{status:'existing'}});expect(await activateCompanion('server',()=>{})).toBe('existing');expect(mockPost).toHaveBeenCalledTimes(1);
});
it('does not power down a server if current compatibility is unavailable',async()=>{
 mockGet.mockResolvedValue({data:{supported:false,can_install:true}});await expect(activateCompanion('server',()=>{})).rejects.toThrow('companion_unavailable');expect(mockPost).not.toHaveBeenCalled();
});
it('never force-stops after the shutdown timeout',async()=>{
 jest.useFakeTimers();mockStats.mockResolvedValue({status:'running'});const promise=activateCompanion('server',()=>{});const assertion=expect(promise).rejects.toThrow('companion_stop_timeout');
 await act(async()=>{await Promise.resolve();await Promise.resolve();});
 for(let i=0;i<81;i++)await act(async()=>{jest.advanceTimersByTime(1500);await Promise.resolve();});
 await assertion;expect(mockPost.mock.calls.map(c=>c[1])).toEqual([{signal:'stop'}]);
});

it('restores a server reminder after browser storage was cleared',async()=>{
 const token=`${Date.now()}:server-reminder`;
 mockGet.mockImplementation((url:string)=>Promise.resolve({data:url.endsWith('/followup')?{pending:token}:{supported:true,can_install:true,kind:'mod',read_only:true,software:'forge',minecraft:'1.20.1'}}));
 mockStatus='running';render(<PlayerCompanionPrompt/>);await screen.findByText('Mod compatible',{exact:false});
 fireEvent.click(screen.getByRole('button',{name:'Plus tard'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 expect(mockPost).toHaveBeenCalledWith('/api/client/extensions/vinuscatalog/servers/server/players/companion/followup/dismiss',{token});
});
it('keeps the dialog visible if dismissal cannot be saved',async()=>{
 mockStatus='running';queueCompanion('user','server');render(<PlayerCompanionPrompt/>);await screen.findByText('Mod compatible',{exact:false});
 mockPost.mockRejectedValueOnce(new Error('Network unavailable'));fireEvent.click(screen.getByRole('button',{name:'Plus tard'}));
 await screen.findByText('Request failed');expect(screen.getByRole('dialog')).toBeTruthy();expect(pendingCompanion('user','server')).not.toBeNull();
});

it('forgets a server reminder dismissed on another device before the next start',async()=>{
 const token=`${Date.now()}:${'a'.repeat(32)}`;queueCompanion('user','server',token);
 mockGet.mockResolvedValue({data:{pending:null}});render(<PlayerCompanionPrompt/>);
 await waitFor(()=>expect(pendingCompanion('user','server')).toBeNull());expect(screen.queryByRole('dialog')).toBeNull();expect(mockPost).not.toHaveBeenCalled();
});
