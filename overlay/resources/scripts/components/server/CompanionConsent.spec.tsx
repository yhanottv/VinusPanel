/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import ServerSoftware from './ServerSoftware';
import ServerModpacks from './ServerModpacks';
const mockGet=jest.fn(), mockPost=jest.fn(), mockRefresh=jest.fn();
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
 offer={supported:true,can_install:true,kind:'plugin',read_only:false};mockGet.mockReset();mockPost.mockReset();mockRefresh.mockReset();mockRefresh.mockResolvedValue(undefined);
 mockGet.mockImplementation((url:string)=>Promise.resolve({data:url.endsWith('/types')?{groups:{recommended:{PAPER:{name:'Paper',description:'Server software'}}}}:url.endsWith('/search')?{hits:[{id:'pack',title:'Test pack',description:'Test',author:'Author',downloads:1,page_url:'https://example.com'}],total:1}:url.endsWith('/builds')?{builds:[{id:1,name:'Build 1'}]}:{versions:[{id:'1.21.1',name:'Release',java:21,channel:'RELEASE',games:['1.21.1'],loaders:['fabric'],published:'2026-01-01'}]}}));
 mockPost.mockImplementation((url:string,payload:any)=>Promise.resolve({data:url.endsWith('/plan')?{token:'a'.repeat(48),java:21,image:'java_21',label:'Build 1',size:1,companion:offer,optional:[],files:1,skipped:0,minecraft:'1.21.1',software:'FABRIC'}:{message:'Software installed',backup:'backup-test',companion:{status:payload.install_players?'installed':'declined'}}}));
});
afterEach(cleanup);
async function prepare(modpack=false){
 render(modpack?<ServerModpacks/>:<ServerSoftware/>);
 fireEvent.click(await screen.findByRole('button',{name:modpack?'Installer':/Paper Server software/}));
 await waitFor(()=>expect((screen.getByRole('button',{name:'Préparer l’installation'}) as HTMLButtonElement).disabled).toBe(false));
 fireEvent.click(screen.getByRole('button',{name:'Préparer l’installation'}));
 await screen.findByText('Informations sur les joueurs');
}
it.each([['Oui, installer la liaison',true],['Non, continuer sans la liaison',false]])('sends an explicit version choice: %s',async(label,accepted)=>{
 await prepare();const confirm=screen.getByRole('button',{name:'Confirmer l’installation'}) as HTMLButtonElement;
 expect(confirm.disabled).toBe(true);expect(screen.getAllByRole('radio').every(r=>!(r as HTMLInputElement).checked)).toBe(true);
 fireEvent.click(screen.getByRole('radio',{name:new RegExp(String(label))}));expect(confirm.disabled).toBe(false);fireEvent.click(confirm);
 await waitFor(()=>expect(mockPost).toHaveBeenCalledWith(expect.stringContaining('/install'),{token:'a'.repeat(48),install_players:accepted},{timeout:660000}));
 await screen.findByText(accepted?'Liaison Joueurs installée. Démarrez le serveur pour afficher les données en direct.':/Aucune liaison Joueurs n’a été ajoutée/);
});
it('requires a new choice after cancelling and preparing another installation',async()=>{
 await prepare();fireEvent.click(screen.getByRole('radio',{name:/Oui, installer/}));fireEvent.click(screen.getByRole('button',{name:'Fermer'}));
 fireEvent.click(screen.getByRole('button',{name:/Paper Server software/}));
 await waitFor(()=>expect((screen.getByRole('button',{name:'Préparer l’installation'}) as HTMLButtonElement).disabled).toBe(false));fireEvent.click(screen.getByRole('button',{name:'Préparer l’installation'}));
 await screen.findByText('Informations sur les joueurs');expect(screen.getAllByRole('radio').every(r=>!(r as HTMLInputElement).checked)).toBe(true);
});
it('keeps unsupported installations available without sending consent',async()=>{
 offer.supported=false;await prepare();expect(screen.queryByRole('radio')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Confirmer l’installation'}));
 await waitFor(()=>expect(mockPost).toHaveBeenLastCalledWith(expect.stringContaining('/install'),expect.objectContaining({install_players:false}),expect.anything()));
});
it('also respects refusal when replacing a server with a modpack',async()=>{
 offer.kind='mod';offer.read_only=true;await prepare(true);
 expect(screen.getByText(/mod serveur en lecture seule/)).toBeTruthy();
 fireEvent.click(screen.getByRole('checkbox',{name:'Je confirme le remplacement de ce serveur par ce modpack.'}));
 const confirm=screen.getByRole('button',{name:'Remplacer le serveur et installer'}) as HTMLButtonElement;expect(confirm.disabled).toBe(true);
 fireEvent.click(screen.getByRole('radio',{name:/Non, continuer/}));fireEvent.click(confirm);
 await waitFor(()=>expect(mockPost).toHaveBeenLastCalledWith(expect.stringContaining('/install'),expect.objectContaining({install_players:false,replace:true,optional:[]}),expect.anything()));
});
