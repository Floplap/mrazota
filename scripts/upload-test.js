// Simple Supabase upload test script
// Usage (PowerShell):
// $env:SUPABASE_URL='https://xxxx.supabase.co'; $env:SUPABASE_ANON_KEY='anon-key'; node .\scripts\upload-test.js
// To also insert a posts row (requires service role key and TEST_PROFILE_ID):
// $env:SUPABASE_URL='https://xxxx.supabase.co'; $env:SUPABASE_SERVICE_ROLE_KEY='service-role-key'; $env:TEST_PROFILE_ID='uuid-of-profile'; node .\scripts\upload-test.js

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

let createClient;
function tryRequireSupabase() {
  try {
    ({ createClient } = require('@supabase/supabase-js'));
    return true;
  } catch (err) {
    return false;
  }
}

// Try native require first
if (!tryRequireSupabase()) {
  console.log('@supabase/supabase-js not found, attempting local install into tmp_node_modules...');
  const repoRoot = path.resolve(__dirname, '..');
  const prefixDir = path.join(repoRoot, 'tmp_node_modules');
  const nodeModulesDir = path.join(prefixDir, 'node_modules');

  // Ensure directory exists
  try { require('fs').mkdirSync(prefixDir, { recursive: true }); } catch (e) {}

  // Run npm install with local prefix
  const args = ['install', '@supabase/supabase-js', '--prefix', prefixDir, '--no-audit', '--no-fund'];
  console.log('Running: npm ' + args.join(' '));
  const res = spawnSync('npm', args, { stdio: 'inherit' });
  if (res.error || res.status !== 0) {
    console.warn('Local npm install failed (first attempt). Checking for existing install and retrying with cache...');
    // If tmp_node_modules already contains the package, allow continuing
    const possiblePackage = path.join(nodeModulesDir, '@supabase', 'supabase-js');
    try {
      if (require('fs').existsSync(possiblePackage)) {
        console.log('Found existing local install at', possiblePackage, '- proceeding.');
      } else {
        // Try again with explicit cache and verbose flags
        const retryArgs = ['install', '@supabase/supabase-js', '--prefix', prefixDir, '--cache', path.join(repoRoot, 'npm-cache'), '--no-audit', '--no-fund', '--verbose'];
        console.log('Retrying: npm ' + retryArgs.join(' '));
        const res2 = spawnSync('npm', retryArgs, { stdio: 'inherit' });
        if (res2.error || res2.status !== 0) {
          console.error('Local npm install failed again. Please run manually: npm install @supabase/supabase-js --prefix ./tmp_node_modules --cache ./npm-cache --verbose');
          process.exit(1);
        }
      }
    } catch (e) {
      console.error('Error checking local install:', e);
      process.exit(1);
    }
  }

  // Add local node_modules to NODE_PATH for this process and re-init module paths
  const nodePath = nodeModulesDir;
  process.env.NODE_PATH = process.env.NODE_PATH ? process.env.NODE_PATH + path.delimiter + nodePath : nodePath;
  try {
    // Re-initialize module search paths
    require('module').Module._initPaths();
  } catch (e) {}

  if (!tryRequireSupabase()) {
    console.error('Failed to require @supabase/supabase-js even after local install. Aborting.');
    process.exit(1);
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // optional
const TEST_PROFILE_ID = process.env.TEST_PROFILE_ID; // optional, used only when service role key provided

if (!SUPABASE_URL) {
  console.error('SUPABASE_URL environment variable is required.');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Either SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY must be provided.');
  process.exit(1);
}

const keyToUse = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, keyToUse, {
  // keep default options
});

async function decodeBase64ToFile(b64Path, outPath) {
  const b64 = fs.readFileSync(b64Path, 'utf8').trim();
  const buf = Buffer.from(b64, 'base64');
  fs.writeFileSync(outPath, buf);
}

async function run() {
  try {
    const b64Path = path.join(__dirname, 'test-image.b64');
    const outImagePath = path.join(__dirname, 'test-image.png');
    await decodeBase64ToFile(b64Path, outImagePath);
    // Read file into a Buffer — passing a Buffer avoids undici/Node fetch 'duplex' errors
    const fileBuffer = fs.readFileSync(outImagePath);

    // Ensure bucket exists when using service role key
    const bucketName = 'media';
    if (SUPABASE_SERVICE_ROLE_KEY) {
      try {
        console.log(`Ensuring bucket "${bucketName}" exists (service role key detected)...`);
        const buckets = await supabase.storage.listBuckets();
        const exists = (buckets.data || []).some(b => b.name === bucketName);
        if (!exists) {
          console.log(`Bucket "${bucketName}" not found — creating (public)...`);
          const created = await supabase.storage.createBucket(bucketName, { public: true });
          if (created.error) {
            console.error('Failed to create bucket:', created.error);
          } else {
            console.log('Bucket created:', created.data);
          }
        } else {
          console.log(`Bucket "${bucketName}" already exists.`);
        }
      } catch (e) {
        console.warn('Could not check/create bucket automatically:', e.message || e);
      }
    }

    const remotePath = `tests/test-image-${Date.now()}.png`;
    console.log('Uploading to bucket "media" as', remotePath);

    const { data, error } = await supabase.storage
      .from('media')
      .upload(remotePath, fileBuffer, { upsert: true });

    if (error) {
      console.error('Upload error:', error);
      process.exit(1);
    }

    console.log('Upload OK:', data);

    // public URL (works if bucket is public)
    const { data: urlData, error: urlErr } = supabase.storage
      .from('media')
      .getPublicUrl(remotePath);

    if (urlErr) console.warn('getPublicUrl error', urlErr);
    const publicURL = urlData?.publicUrl || null;
    console.log('Public URL (if bucket is public):', publicURL);

    // If service role key and TEST_PROFILE_ID provided, insert a post row via service role
    if (SUPABASE_SERVICE_ROLE_KEY && TEST_PROFILE_ID) {
      console.log('Service role key provided and TEST_PROFILE_ID present — inserting a test post...');
      const insertResp = await supabase.from('posts').insert([
        {
          author: TEST_PROFILE_ID,
          content: 'Automated test upload',
          media_url: publicURL || remotePath,
          media_type: 'image',
        },
      ]);
      if (insertResp.error) {
          console.error('Failed to insert test post:', insertResp.error);
          // If author FK missing, try to create a minimal profile row (service role expected)
          if (insertResp.error && insertResp.error.code === '23503' && SUPABASE_SERVICE_ROLE_KEY) {
            console.log('Foreign key missing for author — attempting to create minimal profile with provided TEST_PROFILE_ID...');
            try {
              const profileResp = await supabase.from('profiles').insert([
                {
                  id: TEST_PROFILE_ID,
                  full_name: 'Automated Test User',
                  avatar_url: publicURL || null,
                },
              ]);
              if (profileResp.error) {
                console.error('Failed to insert test profile:', profileResp.error);
              } else {
                console.log('Inserted test profile:', profileResp.data);
                // retry post insert
                const retry = await supabase.from('posts').insert([
                  {
                    author: TEST_PROFILE_ID,
                    content: 'Automated test upload',
                    media_url: publicURL || remotePath,
                    media_type: 'image',
                  },
                ]);
                if (retry.error) {
                  console.error('Retry to insert test post failed:', retry.error);
                } else {
                  console.log('Inserted test post after creating profile:', retry.data);
                }
              }
            } catch (e) {
              console.error('Unexpected error while creating profile or retrying insert:', e);
            }
          }
      } else {
        console.log('Inserted test post:', insertResp.data);
      }
    } else {
      console.log('\nNo service role insertion performed.');
      console.log('To insert a post automatically, set SUPABASE_SERVICE_ROLE_KEY and TEST_PROFILE_ID env vars and re-run.');
      console.log('Or run this SQL in the SQL Editor replacing <PROFILE_UUID> and <PUBLIC_URL>:');
      console.log(`\nINSERT INTO posts (author, content, media_url, media_type) VALUES ('<PROFILE_UUID>', 'Test upload from script', '${publicURL || remotePath}', 'image');\n`);
    }

    // cleanup
    try {
      fs.unlinkSync(outImagePath);
    } catch (e) {}

    console.log('Done.');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

run();
