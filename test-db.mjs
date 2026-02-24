import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log('Chaves não encontradas.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClientDocuments() {
    const { data, error } = await supabase.from('client_documents').select('*').limit(1);
    console.log('Teste de leitura (select):', error ? error.message : 'OK - dados:', data);

    const testUpload = await supabase.from('client_documents').insert([{ client_id: 'd9b2d63d-a233-4123-8478-0ebb70a73210', name: 'teste.pdf', file_path: '123/teste.pdf' }]);
    console.log('Teste de gravação (insert):', testUpload.error ? testUpload.error.message : 'OK');
}
checkClientDocuments();
