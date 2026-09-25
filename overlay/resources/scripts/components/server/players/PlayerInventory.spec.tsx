/** @jest-environment jsdom */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import PlayerInventory, { PlayerMeter } from './PlayerInventory';
import { PlayerDetail } from './types';
jest.mock('@/locales/translate',()=>({vt:(s:string,v:Record<string,unknown>={})=>s.replace(/{{(\w+)}}/g,(_,key)=>String(v[key]??''))}));
jest.mock('./PlayerSkin',()=>()=>null);
afterEach(cleanup);
const player={uuid:'00000000-0000-4000-8000-000000000001',name:'Test',inventory:[{slot:0,id:'minecraft:apple',count:12,name:null,enchanted:false,damage:0},{slot:103,id:'mod:helmet',count:1,name:'Custom helmet',enchanted:true,damage:3}],ender_chest:[{slot:2,id:'minecraft:diamond',count:2,name:null,enchanted:false,damage:0}]} as PlayerDetail;
it('keeps items read-only and maps armor, hotbar and unknown modded items',()=>{
 const {container}=render(<PlayerInventory player={player} endpoint="/players" textures={{'minecraft:apple':'Apple'}} ender={false}/>);
 expect(screen.getByRole('img',{name:'Accès rapide 1 · Apple × 12'})).toBeTruthy();
 expect(screen.getByRole('img',{name:'Casque · Custom helmet × 1 · Enchanté'})).toBeTruthy();
 expect(container.querySelectorAll('button,input,[draggable="true"]').length).toBe(0);
 expect(container.querySelector('use')?.getAttribute('href')).toBe('/assets/images/vinus/players/items.svg#apple');
});
it('shows only Ender chest items in its separate view',()=>{
 render(<PlayerInventory player={player} endpoint="/players" textures={{}} ender/>);
 expect(screen.getByRole('img',{name:'Emplacement 3 · minecraft:diamond × 2'})).toBeTruthy();
 expect(screen.queryByText('Custom helmet')).toBeNull();
 expect(screen.getAllByRole('img').length).toBe(27);
});
it('does not invent a missing health value',()=>{
 render(<PlayerMeter kind="health" value={null} max={20} label="Vie"/>);
 const meter=screen.getByRole('meter');expect(meter.hasAttribute('aria-valuenow')).toBe(false);expect(meter.getAttribute('aria-valuetext')).toBe('Indisponible');
});
