# Create GitHub Release Script

# GitHub repository details
$owner = "Karan2907"
$repo = "WhatsApp-Sales-Channel-Tool"
$tag = "v1.0.0"
$releaseName = "WhatsApp Sales Channel Tool v1.0.0"
$releaseNotesPath = "RELEASE_NOTES.md"

# Check if GitHub CLI is installed
try {
    $ghVersion = gh --version
    Write-Host "GitHub CLI found: $ghVersion"
    
    # Create release using GitHub CLI
    gh release create $tag "release/WhatsApp-Sales-Channel-Tool-Setup.exe" "release/WhatsApp-Sales-Channel-Tool.zip" --title $releaseName --notes-file $releaseNotesPath
    
    Write-Host "Release created successfully!"
} catch {
    Write-Host "GitHub CLI not found or error occurred. Please create the release manually on GitHub."
    Write-Host "You need to upload these files:"
    Write-Host "1. release/WhatsApp-Sales-Channel-Tool-Setup.exe"
    Write-Host "2. release/WhatsApp-Sales-Channel-Tool.zip"
    Write-Host "Release tag: $tag"
    Write-Host "Release name: $releaseName"
}