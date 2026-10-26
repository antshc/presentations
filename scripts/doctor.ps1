[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$failures = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()

function Write-Check {
    param(
        [Parameter(Mandatory)][bool]$Passed,
        [Parameter(Mandatory)][string]$Message,
        [switch]$Warning
    )

    if ($Passed) {
        Write-Host "[OK]   $Message" -ForegroundColor Green
        return
    }

    if ($Warning) {
        Write-Host "[WARN] $Message" -ForegroundColor Yellow
        $warnings.Add($Message)
        return
    }

    Write-Host "[FAIL] $Message" -ForegroundColor Red
    $failures.Add($Message)
}

function Find-DrawioExecutable {
    $candidates = [System.Collections.Generic.List[string]]::new()

    if ($env:DRAWIO_EXE) {
        $candidates.Add($env:DRAWIO_EXE)
    }

    foreach ($commandName in @('drawio', 'draw.io')) {
        $command = Get-Command $commandName -ErrorAction SilentlyContinue
        if ($command -and $command.Source) {
            $candidates.Add($command.Source)
        }
    }

    if ($env:LOCALAPPDATA) {
        $candidates.Add((Join-Path $env:LOCALAPPDATA 'Programs\draw.io\draw.io.exe'))
    }
    if ($env:ProgramFiles) {
        $candidates.Add((Join-Path $env:ProgramFiles 'draw.io\draw.io.exe'))
    }

    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    return $null
}

Push-Location $repoRoot
try {
    $node = Get-Command node -ErrorAction SilentlyContinue
    Write-Check ([bool]$node) 'Node.js is available.'
    if ($node) {
        $nodeVersionText = (& node --version).Trim().TrimStart('v')
        $nodeVersion = [version]$nodeVersionText
        Write-Check ($nodeVersion.Major -ge 18) "Node.js $nodeVersionText satisfies the >=18 requirement."
    }

    $npm = Get-Command npm -ErrorAction SilentlyContinue
    Write-Check ([bool]$npm) 'npm is available.'
    if ($npm) {
        Write-Host "       npm $((& npm --version).Trim())"
    }

    $codex = Get-Command codex -ErrorAction SilentlyContinue
    Write-Check ([bool]$codex) 'Codex is available.'

    $drawio = Find-DrawioExecutable
    Write-Check ([bool]$drawio) 'draw.io Desktop is available for layout and export.' -Warning
    if ($drawio) {
        Write-Host "       $drawio"
    }

    $mcpPackage = Join-Path $repoRoot 'node_modules\@drawio\mcp\package.json'
    Write-Check (Test-Path -LiteralPath $mcpPackage -PathType Leaf) 'The pinned @drawio/mcp package is installed locally.'

    $skillPath = Join-Path $repoRoot '.agents\skills\presentation-planning\SKILL.md'
    $templatePath = Join-Path $repoRoot '.agents\skills\presentation-planning\templates\presentation-plan.md'
    Write-Check (Test-Path -LiteralPath $skillPath -PathType Leaf) 'The presentation-planning skill is present.'
    Write-Check (Test-Path -LiteralPath $templatePath -PathType Leaf) 'The presentation plan template is present.'

    $draftPath = Join-Path $repoRoot '.draft'
    Write-Check (Test-Path -LiteralPath $draftPath -PathType Container) 'The .draft workspace exists.'

    $git = Get-Command git -ErrorAction SilentlyContinue
    if ($git) {
        & git check-ignore --quiet '.draft/.ignore-probe'
        Write-Check ($LASTEXITCODE -eq 0) '.draft/ is ignored by Git.'
    } else {
        Write-Check $false 'Git is unavailable; .draft ignore status could not be checked.' -Warning
    }

    foreach ($project in @(Get-ChildItem -LiteralPath $draftPath -Directory -ErrorAction SilentlyContinue)) {
        foreach ($folder in @('sources', 'images', 'video', 'references', 'diagrams', 'exports', 'notes')) {
            $expectedPath = Join-Path $project.FullName $folder
            Write-Check (Test-Path -LiteralPath $expectedPath -PathType Container) "$($project.Name)/$folder exists." -Warning
        }
        Write-Check (Test-Path -LiteralPath (Join-Path $project.FullName 'plan.md') -PathType Leaf) "$($project.Name)/plan.md exists." -Warning
    }

    if ($codex) {
        try {
            $pluginList = (& codex plugin list 2>&1 | Out-String)
            $pluginInstalled = $pluginList -match '(?m)^drawio@drawio\s+installed, enabled'
            Write-Check $pluginInstalled 'The drawio@drawio Codex plugin is installed and enabled.' -Warning
            if (-not $pluginInstalled) {
                Write-Host '       Install with:'
                Write-Host '       codex plugin marketplace add jgraph/drawio-mcp'
                Write-Host '       codex plugin add drawio@drawio'
            }
        } catch {
            Write-Check $false "Codex was found, but plugin status could not be queried: $($_.Exception.Message)" -Warning
        }
    }
} finally {
    Pop-Location
}

if ($warnings.Count -gt 0) {
    Write-Host "Doctor completed with $($warnings.Count) warning(s)." -ForegroundColor Yellow
}
if ($failures.Count -gt 0) {
    Write-Host "Doctor failed with $($failures.Count) required check(s)." -ForegroundColor Red
    exit 1
}

Write-Host 'Doctor completed successfully.' -ForegroundColor Green
