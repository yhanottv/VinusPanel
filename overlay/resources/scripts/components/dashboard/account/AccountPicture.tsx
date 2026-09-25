import React, { useEffect, useRef, useState } from 'react';
import { useStoreState } from '@/state/hooks';
import { vt } from '@/locales/translate';
import BoringAvatar from 'boring-avatars';
import MessageBox from '@/components/MessageBox';
import useProfileAppearance from '../profile/useProfileAppearance';
import { resizeImage } from '../profile/avatarImage';
import styles from './account.module.css';

export default function AccountPicture() {
    const uuid=useStoreState(s=>s.user.data?.uuid);
    const {appearance,update}=useProfileAppearance(uuid);
    const [draft,setDraft]=useState(appearance.avatar);
    const [busy,setBusy]=useState(false);
    const [error,setError]=useState('');
    const [saved,setSaved]=useState(false);
    const input=useRef<HTMLInputElement>(null);
    useEffect(()=>setDraft(appearance.avatar),[appearance.avatar]);
    const choose=async(file?:File)=>{
        if(!file)return;
        setSaved(false);setError('');
        if(!['image/png','image/jpeg','image/gif','image/webp'].includes(file.type)||file.size>3*1024*1024){setError(vt('Choisissez une image PNG, JPG, GIF ou WebP de 3 Mo maximum.'));return;}
        setBusy(true);
        try{setDraft(await resizeImage(file,256));}catch(e){setError(e instanceof Error?e.message:vt('Impossible de traiter cette image.'));}finally{setBusy(false);}
    };
    const save=()=>{
        try{update({...appearance,avatar:draft});setSaved(true);setError('');}
        catch{setError(vt('Impossible d’enregistrer la photo sur cet appareil. Vérifiez le stockage de votre navigateur.'));}
    };
    return <section className={styles.section} aria-labelledby="account-picture-title">
        <header><h2 id="account-picture-title">{vt('Votre photo')}</h2><p>{vt('Choisissez votre image ou conservez l’avatar généré pour vous.')}</p></header>
        {error&&<MessageBox type="error" onDismiss={()=>setError('')}>{error}</MessageBox>}
        <div className={styles.pictureRow}>
            <div className={styles.avatar}>{draft?<img src={draft} alt={vt('Aperçu du profil')}/>:<BoringAvatar name={uuid||'system'} size={64} variant="beam" colors={['#ff7a1a','#ffad66','#f2c94c','#43d6a3','#475569']}/>}</div>
            <div className={styles.pictureControls}>
                <input ref={input} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={e=>{void choose(e.target.files?.[0]);e.target.value='';}}/>
                <button type="button" className={styles.secondary} disabled={busy} onClick={()=>input.current?.click()}><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="3" width="16" height="14" rx="3"/><circle cx="7" cy="8" r="1.5"/><path d="m3 15 5-4 3 2 3-5 4 7"/></svg>{vt(busy?'Préparation…':'Choisir une photo')}</button>
                {draft&&<button type="button" className={styles.textButton} onClick={()=>{setDraft('');setSaved(false);}}>{vt('Retirer la photo')}</button>}
                <p>{vt('PNG, JPG, GIF ou WebP · 3 Mo maximum · recadrage carré de 256 pixels.')}</p>
            </div>
        </div>
        <footer className={styles.pictureFooter}><small role="status">{vt(saved?'Photo enregistrée sur cet appareil.':'Cette photo est enregistrée dans ce navigateur.')}</small><button type="button" className={styles.primary} disabled={busy||draft===appearance.avatar||!uuid} onClick={save}>{vt('Enregistrer')}</button></footer>
    </section>;
}
