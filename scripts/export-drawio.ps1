[CmdletBinding()]
param(
    [Parameter(Mandatory)][Alias('Input')][string]$Source,
    [Parameter(Mandatory)][ValidateSet('png', 'svg', 'pdf')][string]$Format,
    [Parameter(Mandatory)][string]$Output,
    [ValidateRange(1, [int]::MaxValue)][int]$Page,
    [switch]$AllPages,
    [ValidateRange(0.1, 20.0)][double]$Scale = 1.0,
    [ValidateRange(0, 1000)][int]$Border = 0,
    [switch]$NoEmbed
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($Page -and $AllPages) {
    throw 'Use either -Page or -AllPages, not both.'
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$draftRoot = [System.IO.Path]::GetFullPath((Join-Path $repoRoot '.draft'))
$inputPath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $Source))
$outputPath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $Output))

function Test-IsUnderDraft {
    param([Parameter(Mandatory)][string]$Path)
    $prefix = $draftRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
    return $Path.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)
}

if (-not (Test-IsUnderDraft $inputPath)) {
    throw "Input must be under $draftRoot"
}
if (-not (Test-Path -LiteralPath $inputPath)) {
    throw "Input does not exist: $inputPath"
}
if (-not (Test-IsUnderDraft $outputPath)) {
    throw "Output must be under $draftRoot"
}
if ((Test-Path -LiteralPath $inputPath -PathType Leaf) -and ([System.IO.Path]::GetExtension($inputPath) -ne '.drawio')) {
    throw 'File input must have the .drawio extension.'
}

$drawioCandidates = [System.Collections.Generic.List[string]]::new()
if ($env:DRAWIO_EXE) {
    $drawioCandidates.Add($env:DRAWIO_EXE)
}
foreach ($commandName in @('drawio', 'draw.io')) {
    $command = Get-Command $commandName -ErrorAction SilentlyContinue
    if ($command -and $command.Source) {
        $drawioCandidates.Add($command.Source)
    }
}
if ($env:LOCALAPPDATA) {
    $drawioCandidates.Add((Join-Path $env:LOCALAPPDATA 'Programs\draw.io\draw.io.exe'))
}
if ($env:ProgramFiles) {
    $drawioCandidates.Add((Join-Path $env:ProgramFiles 'draw.io\draw.io.exe'))
}
$drawioExe = $drawioCandidates | Where-Object { $_ -and (Test-Path -LiteralPath $_ -PathType Leaf) } | Select-Object -First 1
if (-not $drawioExe) {
    throw 'draw.io Desktop was not found. Install it or set DRAWIO_EXE to the executable path.'
}

New-Item -ItemType Directory -Path $outputPath -Force | Out-Null

$sourceFiles = @(if (Test-Path -LiteralPath $inputPath -PathType Container) {
    Get-ChildItem -LiteralPath $inputPath -Filter '*.drawio' -File -Recurse
} else {
    Get-Item -LiteralPath $inputPath
})
if ($sourceFiles.Count -eq 0) {
    throw "No .drawio source files found under $inputPath"
}

$sourceHashes = @{}
foreach ($sourceFile in $sourceFiles) {
    $sourceHashes[$sourceFile.FullName] = (Get-FileHash -LiteralPath $sourceFile.FullName -Algorithm SHA256).Hash
}

$arguments = [System.Collections.Generic.List[string]]::new()
$arguments.Add('--export')
$arguments.Add('--format')
$arguments.Add($Format)
$arguments.Add('--output')
$arguments.Add($outputPath)
$arguments.Add('--scale')
$arguments.Add($Scale.ToString([System.Globalization.CultureInfo]::InvariantCulture))
$arguments.Add('--border')
$arguments.Add($Border.ToString())
if (-not $NoEmbed) {
    $arguments.Add('--embed-diagram')
}
if ($Page) {
    $arguments.Add('--page-index')
    $arguments.Add($Page.ToString())
}
if ($AllPages) {
    $arguments.Add('--all-pages')
}
if (Test-Path -LiteralPath $inputPath -PathType Container) {
    $arguments.Add('--recursive')
}
$arguments.Add($inputPath)

$process = Start-Process -FilePath $drawioExe -ArgumentList $arguments.ToArray() -Wait -PassThru -WindowStyle Hidden
if ($process.ExitCode -ne 0) {
    throw "draw.io export failed with exit code $($process.ExitCode)."
}

foreach ($sourceFile in $sourceFiles) {
    $currentHash = (Get-FileHash -LiteralPath $sourceFile.FullName -Algorithm SHA256).Hash
    if ($currentHash -ne $sourceHashes[$sourceFile.FullName]) {
        throw "Source diagram changed during export: $($sourceFile.FullName)"
    }
}

Write-Host "Export completed: $outputPath" -ForegroundColor Green
