/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Form, Formik } from 'formik';
import AccountField from './AccountField';
jest.mock('@/locales/translate', () => ({ vt: (text:string) => text }));
jest.mock('@/components/elements/Input', () => ({ __esModule:true, default:({hasError,isLight,...props}:any) => <input {...props}/> }));
jest.mock('@/components/elements/Label', () => ({ __esModule:true, default:({isLight,...props}:any) => <label {...props}/> }));

it('reveals only its password, preserves the value and does not submit the form', async () => {
    const submit=jest.fn();
    render(<Formik initialValues={{current:'example-only',password:'other-example'}} onSubmit={submit}><Form>
        <AccountField id="current" name="current" label="Current password" type="password"/>
        <AccountField id="new" name="password" label="New password" type="password"/>
    </Form></Formik>);
    const input=screen.getByLabelText('Current password') as HTMLInputElement;
    const button=screen.getByRole('button',{name:'Afficher le mot de passe — Current password'});
    fireEvent.click(button);
    expect(input.type).toBe('text'); expect(input.value).toBe('example-only');
    expect((screen.getByLabelText('New password') as HTMLInputElement).type).toBe('password');
    expect(button.getAttribute('aria-pressed')).toBe('true'); expect(submit).not.toHaveBeenCalled();
    fireEvent.click(button); expect(input.type).toBe('password'); expect(submit).not.toHaveBeenCalled();
});

it('keeps Formik validation and associates the error with the input', async () => {
    render(<Formik initialValues={{email:''}} onSubmit={()=>{}} validate={()=>({email:'Required'})}><Form>
        <AccountField id="email" name="email" label="Email" type="email"/>
    </Form></Formik>);
    const input=screen.getByLabelText('Email');fireEvent.blur(input);
    await waitFor(()=>expect(screen.getByText('Required')).toBeTruthy());
    expect(input.getAttribute('aria-invalid')).toBe('true');expect(input.getAttribute('aria-describedby')).toBe('email-help');
    expect(screen.queryByRole('button')).toBeNull();
});
