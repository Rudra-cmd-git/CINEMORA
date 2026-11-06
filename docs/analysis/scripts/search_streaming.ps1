$bundle = Get-Content -Path "C:\Users\rudra\OneDrive\Desktop\CINEMORA\NetMirror_index.bundle" -Encoding Byte -Raw
$text = [System.Text.Encoding]::UTF8.GetString($bundle)

# Search for any string containing "app" followed by domain patterns
$patterns = @(
    'netmirror\.app',
    'api\.',
    'stream\.',
    'video\.',
    'media\.',
    'vod\.',
    'playback\.',
    'content\.',
    'cdn\.',
    'secure\.',
    'wss://',
    'wss:',
    '.m3u8',
    '.mpd',
    '.mp4',
    '.ts',
    '.hls',
    '.dash'
)

foreach ($pat in $patterns) {
    $matches = [regex]::Matches($text, ".{0,100}$pat.{0,100}", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($matches.Count -gt 0) {
        Write-Host "=== $pat ($($matches.Count)) ==="
        $matches | Select-Object -First 10 | ForEach-Object { 
            $ctx = $_.Value -replace "`n"," " -replace "`r"," "
            Write-Host "  $ctx"
        }
        Write-Host ""
    }
}