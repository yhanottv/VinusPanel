import React from 'react';
import LoginContainer from '@/components/auth/LoginContainer';
import { useDesignPreview } from '@/designRuntime';

export default function LoginPreview() {
    useDesignPreview(true);
    return <div className="auth-layout"><LoginContainer preview /></div>;
}
