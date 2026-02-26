import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing keys");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const clientId = 'f1eb23de-3b48-41e8-9b44-ea9974b88082';
    console.log("Using client:", clientId);

    console.log("2. Uploading a dummy file to storage...");
    const dummyText = "Hello world";
    const blob = new Blob([dummyText], { type: 'text/plain' });

    const path = `${clientId}/test_${Date.now()}.txt`;

    // This fails in Node (Blob isn't fully compatible with JS fetch in some old versions),
    // but we are running Node > 18 so it should have global Blob and fetch.
    // We'll pass an ArrayBuffer to be perfectly safe for Node testing.
    const arrayBuffer = await blob.arrayBuffer();

    console.time('upload');
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(path, arrayBuffer, { contentType: 'text/plain', upsert: true });
    console.timeEnd('upload');

    if (uploadError) {
        console.error("Upload error JSON:", JSON.stringify(uploadError, null, 2));
    } else {
        console.log("Upload success:", uploadData);

        const { data: publicUrlData } = supabase.storage.from('client-documents').getPublicUrl(path);
        console.log("Public URL:", publicUrlData.publicUrl);

        console.log("3. Inserting to database...");
        console.time('insert');
        const { error: dbError } = await supabase.from('client_documents').insert({
            client_id: clientId,
            name: "test.txt",
            type: "Outros",
            url: publicUrlData.publicUrl,
        });
        console.timeEnd('insert');

        if (dbError) {
            console.error("DB Insert error:", dbError);
        } else {
            console.log("DB Insert success!");
        }
    }
}

test();
