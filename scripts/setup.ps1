[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$draftPath = Join-Path $repoRoot '.draft'
$doctorPath = Join-Path $PSScriptRoot 'doctor.ps1'

Push-Location $repoRoot
try {
    if (-not (Test-Path -LiteralPath $draftPath -PathType Container)) {
        New-Item -ItemType Directory -Path $draftPath | Out-Null
        Write-Host 'Created .draft workspace.'
    } else {
        Write-Host '.draft workspace already exists.'
    }

    foreach ($commandName in @('node', 'npm', 'npx')) {
        if (-not (Get-Command $commandName -ErrorAction SilentlyContinue)) {
            throw "$commandName is required. Install Node.js LTS from https://nodejs.org/ and rerun setup."
        }
    }

    $bun = Get-Command bun -ErrorAction SilentlyContinue
    if (-not $bun) {
        throw 'Bun is required. Install it from https://bun.sh/ and rerun setup.'
    }

    if (Test-Path -LiteralPath (Join-Path $repoRoot 'bun.lock') -PathType Leaf) {
        & bun install --frozen-lockfile
    } else {
        & bun install
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Bun dependency installation failed with exit code $LASTEXITCODE."
    }

    if (-not (Get-Command codex -ErrorAction SilentlyContinue)) {
        Write-Warning 'Codex was not found. Install Codex before using the repository-local skill.'
    }

    $drawioCandidates = @(
        $env:DRAWIO_EXE,
        $(if ($env:LOCALAPPDATA) { Join-Path $env:LOCALAPPDATA 'Programs\draw.io\draw.io.exe' }),
        $(if ($env:ProgramFiles) { Join-Path $env:ProgramFiles 'draw.io\draw.io.exe' })
    ) | Where-Object { $_ }
    $drawioCommand = Get-Command drawio, draw.io -ErrorAction SilentlyContinue | Select-Object -First 1
    $drawioFound = [bool]$drawioCommand -or [bool]($drawioCandidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1)
    if (-not $drawioFound) {
        Write-Warning 'draw.io Desktop was not found. Install it from https://github.com/jgraph/drawio-desktop/releases or set DRAWIO_EXE.'
    }

    if (Get-Command codex -ErrorAction SilentlyContinue) {
        try {
            $pluginList = (& codex plugin list 2>&1 | Out-String)
            if ($pluginList -notmatch '(?m)^drawio@drawio\s+installed, enabled') {
                Write-Warning 'The draw.io Codex plugin is not installed. Run:'
                Write-Host '  codex plugin marketplace add jgraph/drawio-mcp'
                Write-Host '  codex plugin add drawio@drawio'
            }
        } catch {
            Write-Warning "Codex was found, but plugin status could not be queried: $($_.Exception.Message)"
        }
    }

    & $doctorPath
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}
