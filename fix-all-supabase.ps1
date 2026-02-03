Write-Host 'Fixing all Supabase imports...' -ForegroundColor Green
Write-Host ''

$filesToFix = @(
    'src\app\admin\page.tsx',
    'src\app\booter-dashboard\page.tsx',
    'src\app\checkout-UniquematchId]\page.tsx',
    'src\app\hooper-dashboard\page.tsx',
    'src\app\journeys\page.tsx',
    'src\app\journeys\create\page.tsx',
    'src\app\login\page.tsx',
    'src\app\matches-Uniqueid]\page.tsx',
    'src\app\messages\page.tsx',
    'src\app\messages-UniquematchId]\page.tsx',
    'src\app\profile\page.tsx',
    'src\app\ratings\create\page.tsx',
    'src\app\register\page.tsx',
    'src\app\requests\page.tsx',
    'src\app\requests\create\page.tsx'
)

foreach ($file in $filesToFix) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Fix import statement
        $content = $content -replace "import \{ createClientComponentClient \} from '@supabase/auth-helpers-nextjs';", "import { createSupabaseClient } from '@/lib/supabase';"
        
        # Fix usage (escape parentheses)
        $content = $content -replace 'const supabase = createClientComponentClient-Unique-Unique;', 'const supabase = createSupabaseClient();'
        
        # Save file
        Set-Content -Path $file -Value $content -NoNewline
        
        Write-Host "✓ Fixed: $file" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Not found: $file" -ForegroundColor Red
    }
}

Write-Host ''
Write-Host 'All files fixed!' -ForegroundColor Green
Write-Host 'Now run: npm run dev' -ForegroundColor Cyan
