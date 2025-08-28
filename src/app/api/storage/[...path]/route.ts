import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

// Este handler de rota irá lidar com o acesso a arquivos privados do Supabase.
// Ele gera uma URL assinada e temporária para que o cliente possa acessar o arquivo.

export async function GET(
  req: Request,
  { params }: { params: { path: string[] } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Decodifica a URL para lidar com caracteres especiais (ex: espaços %20)
  const decodedFilePath = decodeURIComponent(params.path.join('/'));
  const bucketName = decodedFilePath.split('/')[0];

  if (!bucketName || !decodedFilePath) {
    return new Response('File path is required', { status: 400 });
  }

  console.log('Attempting to create signed URL for:');
  console.log('  Bucket:', bucketName);
  console.log('  Path within bucket:', decodedFilePath.substring(bucketName.length + 1));

  // Usar o cliente admin para gerar a URL assinada, pois ele tem as permissões necessárias.
  const supabaseAdmin = createAdminClient();

  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .createSignedUrl(decodedFilePath.substring(bucketName.length + 1), 60); // URL válida por 60 segundos

  if (error) {
    console.error('Error creating signed URL:', error);
    return new Response('Could not create signed URL', { status: 500 });
  }

  // Redireciona o cliente para a URL assinada, que permite o download/visualização do arquivo.
  return NextResponse.redirect(data.signedUrl);
}
