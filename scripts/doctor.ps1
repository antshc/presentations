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
    $bun = Get-Command bun -ErrorAction SilentlyContinue
    Write-Check ([bool]$bun) 'Bun is available.'
    if ($bun) {
        $bunVersionText = (& bun --version).Trim()
        $bunVersion = [version]($bunVersionText -replace '[-+].*$', '')
        Write-Check ($bunVersion -ge [version]'1.1') "Bun $bunVersionText satisfies the >=1.1 requirement."
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

    $baoyuSkillFiles = [ordered]@{
        'baoyu-comic' = @('SKILL.md', 'references\base-prompt.md', 'scripts\main.ts')
        'baoyu-xhs-images' = @('SKILL.md', 'references\elements\canvas.md')
        'baoyu-image-gen' = @('SKILL.md', 'scripts\main.ts', 'references\usage-examples.md')
    }
    foreach ($skillName in $baoyuSkillFiles.Keys) {
        $skillRoot = Join-Path $repoRoot ".agents\skills\$skillName"
        $missingFiles = @(
            $baoyuSkillFiles[$skillName] |
                Where-Object { -not (Test-Path -LiteralPath (Join-Path $skillRoot $_) -PathType Leaf) }
        )
        Write-Check ($missingFiles.Count -eq 0) "$skillName and its required supporting files are present."
        if ($missingFiles.Count -gt 0) {
            Write-Host "       Missing: $($missingFiles -join ', ')"
        }
    }

    $skillsLockPath = Join-Path $repoRoot 'skills-lock.json'
    Write-Check (Test-Path -LiteralPath $skillsLockPath -PathType Leaf) 'The project-local skill lock is present.'

    $draftPath = Join-Path $repoRoot '.draft'
    Write-Check (Test-Path -LiteralPath $draftPath -PathType Container) 'The .draft workspace exists.'

    $git = Get-Command git -ErrorAction SilentlyContinue
    if ($git) {
        & git check-ignore --quiet '.draft/probe/images/probe.png'
        $assetsIgnored = ($LASTEXITCODE -eq 0)
        & git check-ignore --quiet '.draft/probe/plan.md'
        $planIgnored = ($LASTEXITCODE -eq 0)
        & git check-ignore --quiet '.draft/probe/diagrams/probe.drawio'
        $trackedIgnored = $planIgnored -or ($LASTEXITCODE -eq 0)
        Write-Check ($assetsIgnored -and -not $trackedIgnored) '.draft/ assets are ignored; plan.md and diagrams/*.drawio are tracked.'
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
