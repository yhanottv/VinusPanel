/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PlayerCompanion from './PlayerCompanion';
const mockGet=jest.fn(),mockPost=jest.fn();
jest.mock('@/api/http',()=>({__esModule:true,default:{get:(...a:any[])=>mockGet(...a),post:(...a:any[])=>mockPost(...a)},httpErrorToHuman:()=> 'Stop the server first'}));
jest.mock('@/components/MessageBox',()=>({__esModule:true,default:({children}:any)=><aside>{children}</aside>}));
jest.mock('@/designRuntime',()=>({designPreview:false}));
jest.mock('@/locales/translate',()=>({vt:(s:string)=>s}));
beforeEach(()=>{mockGet.mockReset();mockPost.mockReset();mockGet.mockResolvedValue({data:{supported:true,can_install:true,kind:'mod',minecraft:'1.21.1',software:'fabric',read_only:true}});});
it('does not install anything when loading availability',async()=>{
 render(<PlayerCompanion endpoint="/players" onInstalled={()=>{}}/>);
 await screen.findByRole('button',{name:'Installer la liaison'});expect(mockGet).toHaveBeenCalledWith('/players/companion');expect(mockPost).not.toHaveBeenCalled();
});
it('does not offer installation without permission',async()=>{
 mockGet.mockResolvedValue({data:{supported:true,can_install:false,kind:'plugin'}});
 render(<PlayerCompanion endpoint="/players" onInstalled={()=>{}}/>);await screen.findByText(/Plugin compatible/);
 expect(screen.queryByRole('button')).toBeNull();expect(mockPost).not.toHaveBeenCalled();
});
it('reports installation failure without claiming success or retrying automatically',async()=>{
 const installed=jest.fn();mockPost.mockRejectedValue(new Error('offline required'));
 render(<PlayerCompanion endpoint="/players" onInstalled={installed}/>);fireEvent.click(await screen.findByRole('button',{name:'Installer la liaison'}));
 await screen.findByText('Stop the server first');expect(installed).not.toHaveBeenCalled();expect(mockPost).toHaveBeenCalledTimes(1);
 await waitFor(()=>expect((screen.getByRole('button',{name:'Installer la liaison'}) as HTMLButtonElement).disabled).toBe(false));
});
