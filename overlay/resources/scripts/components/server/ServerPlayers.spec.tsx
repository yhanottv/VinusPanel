/** @jest-environment jsdom */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ServerPlayers from './ServerPlayers';
const mockPost=jest.fn();const mockGet=jest.fn();
jest.mock('@/api/http',()=>({__esModule:true,default:{get:(...args:any[])=>mockGet(...args),post:(...args:any[])=>mockPost(...args)},httpErrorToHuman:()=> 'Request failed'}));
jest.mock('@/state/server',()=>({ServerContext:{useStoreState:(select:any)=>select({server:{data:{uuid:'00000000-0000-4000-8000-000000000001',name:'Test server'}}})}}));
jest.mock('@/components/elements/PageContentBlock',()=>({__esModule:true,default:({children}:any)=><main>{children}</main>}));
jest.mock('@/components/MessageBox',()=>({__esModule:true,default:({children}:any)=><aside>{children}</aside>}));
jest.mock('@/components/elements/dialog',()=>({Dialog:({open,children}:any)=>open?<div role="dialog">{children}</div>:null}));
jest.mock('@/components/dashboard/DashboardIcon',()=>()=>null);
jest.mock('@/designRuntime',()=>({designPreview:false}));
jest.mock('@/locales/translate',()=>({vt:(s:string,v:Record<string,unknown>={})=>s.replace(/{{(\w+)}}/g,(_,key)=>String(v[key]??''))}));
jest.mock('./players/types',()=>({requestId:()=> 'a'.repeat(32)}));
jest.mock('./players/PlayerSkin',()=>()=>null);
jest.mock('./players/PlayerInventory',()=>({__esModule:true,default:()=>null,PlayerMeter:()=>null}));
const identity={uuid:'00000000-0000-4000-8000-000000000002',name:'TestPlayer',online:true,operator:false,whitelisted:false,banned:false};
const profile={...identity,level:23,xp_total:751,game_mode:'survival',source:'live',health:20,max_health:20,food:20,armor:0,xp_progress:0,updated_at:1,inventory:[],ender_chest:[]};
let control=true;let currentProfile={...profile};
beforeEach(()=>{control=true;currentProfile={...profile};mockPost.mockReset();mockGet.mockReset();mockGet.mockImplementation(()=>Promise.resolve({data:{players:[identity],selected:currentProfile,bridge:true,actions:['heal','kill','feed','operator','whitelist','ban','gamemode','experience'],can_control:control}}));Object.defineProperty(document,'hidden',{configurable:true,value:false});global.fetch=jest.fn().mockResolvedValue({ok:true,json:()=>Promise.resolve({})});});
afterEach(()=>{cleanup();jest.useRealTimers();});
async function open(){render(<ServerPlayers/>);fireEvent.click(await screen.findByRole('button',{name:/TestPlayer En ligne/}));await screen.findByRole('button',{name:'Éliminer'});}
it('requires confirmation for killing and cancels without sending a command',async()=>{
 await open();fireEvent.click(screen.getByRole('button',{name:'Éliminer'}));expect(screen.getByRole('dialog')).toBeTruthy();expect(mockPost).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Annuler'}));expect(screen.queryByRole('dialog')).toBeNull();expect(mockPost).not.toHaveBeenCalled();
});
it('disables every control without console permission',async()=>{
 control=false;await open();expect((screen.getByRole('button',{name:'Éliminer'}) as HTMLButtonElement).disabled).toBe(true);expect((screen.getByRole('switch',{name:'Opérateur'}) as HTMLButtonElement).disabled).toBe(true);fireEvent.click(screen.getByRole('button',{name:'Éliminer'}));expect(mockPost).not.toHaveBeenCalled();
});
it('does not report success when command submission fails',async()=>{
 mockPost.mockRejectedValue({response:{status:409}});await open();fireEvent.click(screen.getByRole('button',{name:/Soigner/}));await waitFor(()=>expect(screen.getByText('Request failed')).toBeTruthy());expect(screen.queryByText(/Action appliquée/)).toBeNull();expect(mockPost).toHaveBeenCalledTimes(1);
});

const tick=async(ms:number)=>{await act(async()=>{jest.advanceTimersByTime(ms);await Promise.resolve();});};
it('refreshes a live profile each second and synchronizes XP and game mode fields',async()=>{
 jest.useFakeTimers();await open();
 expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('23');
 currentProfile={...profile,level:10,game_mode:'creative'};await tick(1000);
 expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('10');
 expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('creative');
});
it('preserves unapplied edits and resumes following the server after they are applied',async()=>{
 jest.useFakeTimers();await open();const level=screen.getByRole('spinbutton') as HTMLInputElement;
 fireEvent.change(level,{target:{value:'27'}});currentProfile={...profile,level:10};await tick(1000);expect(level.value).toBe('27');
 currentProfile={...profile,level:27};await tick(1000);expect(level.value).toBe('27');
 currentProfile={...profile,level:28};await tick(1000);expect(level.value).toBe('28');
});
it('pauses hidden tabs and immediately refreshes when they become visible',async()=>{
 jest.useFakeTimers();await open();const before=mockGet.mock.calls.length;
 Object.defineProperty(document,'hidden',{configurable:true,value:true});fireEvent(document,new Event('visibilitychange'));await tick(5000);expect(mockGet).toHaveBeenCalledTimes(before);
 currentProfile={...profile,level:10};Object.defineProperty(document,'hidden',{configurable:true,value:false});await act(async()=>{fireEvent(document,new Event('visibilitychange'));});
 expect(mockGet).toHaveBeenCalledTimes(before+1);expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('10');
});
it('does not overlap slow requests after focus events',async()=>{
 jest.useFakeTimers();await open();let resolve:any;
 mockGet.mockImplementationOnce(()=>new Promise(r=>{resolve=r;}));await tick(1000);const before=mockGet.mock.calls.length;
 fireEvent(window,new Event('focus'));await tick(4000);expect(mockGet).toHaveBeenCalledTimes(before);
 await act(async()=>{resolve({data:{players:[identity],selected:profile,bridge:true,actions:[],can_control:true}});});
 await tick(1000);expect(mockGet).toHaveBeenCalledTimes(before+1);
});
