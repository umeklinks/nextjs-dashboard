'use server';

import { object, z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
// import { Danfo } from 'next/font/google';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Using zod to format the formData typeof
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer',
    }),
    amount: z.coerce
        .number()
        .gt(0, { message: 'Please enter an amount greater that $0.'}),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
    errors?: {
        customerId?: string[];
        amount?:string[];
        status?: string[];
    };
    message?: string | null;
}

export async function createInvoice(prevState: State, formData: FormData) {

    // const rawFormData = {
    //     customerId: formData.get('customerId'),
    //     amount: formData.get('amount'),
    //     status: formData.get('status'),
    // };
    // Testit out
    // console.log(typeof rawFormData.amount);

    
    // Validate form using Zod
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    // If form validation fails, return errors. Otherwise, contunue.
    if (!validatedFields.success ) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing fields. Failed to Create Invoice.',
        };
    }

    // Prepare data for insertion into database
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    console.log(validatedFields);
    // Insert data into database
    try {
        await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    } catch(error) {
        message: `${error} Database Error: Failed to Create Invoice.`
    }

    // Revalidate the cache for the invoices page and redirect the user
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');



};

export async function updateInvoice(id: string, prevState: State, formData: FormData) {

    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!validatedFields.success ) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing fields. Failed to Create Invoice.',
        };
    }

    const { customerId, amount, status } = validatedFields.data;
        // customerId: formData.get('customerId')
    const amountInCents = amount * 100;
        // amount: formData.get('amount'),
        // status: formData.get('status'),

    try {
        await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status} 
        WHERE id = ${id}
    `;
    } catch (error) {
        message: `${error} Database Error: Failed to Update Invoice.`;
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');

}

export async function deleteInvoice(id: string) {
    // throw new Error('Failed to Delete Invoice');
    await sql`
        DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');

}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
){
    let responseRedirectUrl = null;
    try {
        console.log('formData', formData);
        responseRedirectUrl = await signIn('credentials', {
            ...Object.fromEntries(formData),
            redirect: false
        });
        
    } catch (error) {
        console.log('error', error);
        // if (error instanceof AuthError) {
        //     switch (error.type) {
        //         case 'CredentialsSignin':
        //             return 'Invalid credentials.';
        //         default:
        //             return 'Something went wrong.';
        //     }
        // }
        if ((error as Error).message.includes('CrendencialsSignin')) {
            return'CrendentialsSignin';
        }
        throw error;
    } finally {
        if (responseRedirectUrl) redirect(responseRedirectUrl);
    }
}