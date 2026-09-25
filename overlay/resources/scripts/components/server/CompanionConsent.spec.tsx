/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import ServerSoftware from './ServerSoftware';
import ServerModpacks from './ServerModpacks';
const mockGet=jest.fn(), mockPost=jest.fn(), mockRefresh=jest.fn(), mockQueue=jest.fn();
jest.mock('easy-peasy',()=>({useStoreState:(fn:any)=>fn({user:{data:{uuid:'user'}}})}));
jest.mock('./players/companionFollowup',()=>({queueCompanion:(...a:any[])=>mockQueue(...a)}));
jest.mock('@/api/http',()=>({__esModule:true,default:{get:(...args:any[])=>mockGet(...args),post:(...args:any[])=>mockPost(...args)},httpErrorToHuman:()=> 'Request failed'}));
jest.mock('@/state/server',()=>({ServerContext:{useStoreState:(select:any)=>select({server:{data:{uuid:'test-server',id:'test',name:'Test server',softwareProfile:{software:'paper',game_version:'1.21.1'}}},status:{value:'offline'}}),useStoreActions:()=>mockRefresh}}));
jest.mock('@/plugins/usePermissions',()=>({usePermissions:(permissions:string[])=>permissions.map(()=>true)}));
jest.mock('./useServerOperation',()=>({__esModule:true,default:()=>({current:()=>true,reconnect:()=>{}})}));
jest.mock('@/components/elements/PageContentBlock',()=>({__esModule:true,default:({children}:any)=><main>{children}</main>}));
jest.mock('@/components/MessageBox',()=>({__esModule:true,default:({children,type}:any)=><aside data-severity={type}>{children}</aside>}));
jest.mock('@/components/elements/dialog',()=>({Dialog:({open,children,onClose}:any)=>open?<div role="dialog"><button onClick={onClose}>Fermer</button>{children}</div>:null}));
jest.mock('react-router-dom',()=>({Link:({children}:any)=><span>{children}</span>}));
jest.mock('./SoftwareIcon',()=>({__esModule:true,default:()=>null,softwareName:()=> 'Paper'}));
jest.mock('@/locales/translate',()=>({vt:(s:string)=>s}));
let offer:any;
beforeEach(()=>{
 offer={supported:true,can_install:true,kind:'plugin',read_only:false};mockGet.mockReset();mockPost.mockReset();mockRefresh.mockReset();mockRefresh.mockResolvedValue(undefined);mockQueue.mockReset();
 mockGet.mockImplementation((url:string)=>Promise.resolve({data:url.endsWith('/types')?{groups:{recommended:{PAPER:{name:'Paper',description:'Server software'}}}}:url.endsWith('/search')?{hits:[{id:'pack',title:'Test pack',description:'Test',author:'Author',downloads:1,page_url:'https://example.com'}],total:1}:url.endsWith('/builds')?{builds:[{id:1,name:'Build 1'}]}:{versions:[{id:'1.21.1',name:'Release',java:21,channel:'RELEASE',games:['1.21.1'],loaders:['fabric'],published:'2026-01-01'}]}}));
 mockPost.mockImplementation((url:string,payload:any)=>Promise.resolve({data:url.endsWith('/plan')?{token:'a'.repeat(48),java:21,image:'java_21',label:'Build 1',size:1,companion:offer,optional:[],files:1,skipped:0,minecraft:'1.21.1',software:'FABRIC'}:{message:'Software installed',backup:'backup-test',companion_followup:'saved-token',companion:{status:payload.install_players?'installed':'declined'}}}));
});
afterEach(cleanup);
async function prepare(modpack=false){
 render(modpack?<ServerModpacks/>:<ServerSoftware/>);
 fireEvent.click(await screen.findByRole('button',{name:modpack?'Installer':/Paper Server software/}));
 await waitFor(()=>expect((screen.getByRole('button',{name:'Préparer l’installation'}) as HTMLButtonElement).disabled).toBe(false));
 fireEvent.click(screen.getByRole('button',{name:'Préparer l’installation'}));
 await screen.findByText('Après l’installation, démarrez le serveur. Une fenêtre vous proposera ensuite d’activer les informations Joueurs.');
}
it('installs software alone and queues a separate offer only after success',async()=>{
 await prepare();expect(screen.queryByRole('radio')).toBeNull();expect(mockQueue).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Confirmer l’installation'}));
 await waitFor(()=>expect(mockPost).toHaveBeenLastCalledWith(expect.stringContaining('/install'),{token:'a'.repeat(48),install_players:false},{timeout:660000}));
 await waitFor(()=>expect(mockQueue).toHaveBeenCalledWith('user','test-server','saved-token'));
});
it('does not offer a companion when the software installation fails',async()=>{
 await prepare();mockPost.mockRejectedValueOnce(new Error('failed'));fireEvent.click(screen.getByRole('button',{name:'Confirmer l’installation'}));
 await screen.findByText('Request failed');expect(mockQueue).not.toHaveBeenCalled();
});
it('preserves the modpack replacement confirmation and defers the companion',async()=>{
 await prepare(true);const button=screen.getByRole('button',{name:'Remplacer le serveur et installer'}) as HTMLButtonElement;
 expect(button.disabled).toBe(true);fireEvent.click(screen.getByRole('checkbox',{name:'Je confirme le remplacement de ce serveur par ce modpack.'}));fireEvent.click(button);
 await waitFor(()=>expect(mockPost).toHaveBeenLastCalledWith(expect.stringContaining('/install'),expect.objectContaining({install_players:false,replace:true,optional:[]}),expect.anything()));
 await waitFor(()=>expect(mockQueue).toHaveBeenCalledWith('user','test-server','saved-token'));
});
