# Builds "Spellbook Table.exe" next to the game files, using the C# compiler that ships with Windows.
# Run:  powershell -ExecutionPolicy Bypass -File launcher\build.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$here = $PSScriptRoot
$icon = Join-Path $here 'app.ico'
$out  = Join-Path (Split-Path $here -Parent) 'Spellbook Table.exe'
$csc  = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path $csc)) { $csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
if (-not (Test-Path $csc)) { throw 'The .NET Framework C# compiler (csc.exe) was not found.' }

# The app icon: an armoured figure holding a glowing open spellbook (drawn in icon.ps1), at several sizes
. (Join-Path $here 'icon.ps1')
function New-IconPng([int]$size) {
  $bmp = New-SpellbookIcon $size
  $ms = New-Object IO.MemoryStream
  if ($size -ge 256) {
    # The large size is stored as PNG (what Windows expects for 256x256)
    $bmp.Save($ms, [Drawing.Imaging.ImageFormat]::Png)
  } else {
    # Smaller sizes use the classic 32-bit bitmap format, which every reader understands
    $w = New-Object IO.BinaryWriter $ms
    $w.Write([UInt32]40); $w.Write([Int32]$size); $w.Write([Int32]($size * 2)); $w.Write([UInt16]1); $w.Write([UInt16]32)
    $w.Write([UInt32]0); $w.Write([UInt32]($size * $size * 4)); $w.Write([Int32]0); $w.Write([Int32]0); $w.Write([UInt32]0); $w.Write([UInt32]0)
    for ($y = $size - 1; $y -ge 0; $y--) {
      for ($x = 0; $x -lt $size; $x++) { $c = $bmp.GetPixel($x, $y); $w.Write([byte]$c.B); $w.Write([byte]$c.G); $w.Write([byte]$c.R); $w.Write([byte]$c.A) }
    }
    # AND mask (all zero: transparency comes from the alpha channel), rows padded to 4 bytes
    $maskRow = [int]([Math]::Ceiling($size / 32.0) * 4)
    $w.Write((New-Object byte[] ($maskRow * $size)))
    $w.Flush()
  }
  $bmp.Dispose()
  return ,$ms.ToArray()
}

# An .ico file is a small header plus one directory entry per image (PNG data is allowed inside)
$sizes = 16, 24, 32, 48, 64, 128, 256
$images = $sizes | ForEach-Object { ,(New-IconPng $_) }
$fs = New-Object IO.MemoryStream
$bw = New-Object IO.BinaryWriter $fs
$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
  $sz = $sizes[$i]; $len = $images[$i].Length
  $bw.Write([byte]($sz % 256)); $bw.Write([byte]($sz % 256)); $bw.Write([byte]0); $bw.Write([byte]0)
  $bw.Write([UInt16]1); $bw.Write([UInt16]32); $bw.Write([UInt32]$len); $bw.Write([UInt32]$offset)
  $offset += $len
}
foreach ($img in $images) { $bw.Write($img) }
[IO.File]::WriteAllBytes($icon, $fs.ToArray())
# The page uses the same icon as its favicon
Copy-Item $icon (Join-Path (Split-Path $here -Parent) 'public\favicon.ico') -Force

& $csc /nologo /target:winexe /optimize+ /platform:anycpu "/win32icon:$icon" "/out:$out" `
  /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.Management.dll /r:System.Web.dll `
  /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll `
  (Join-Path $here 'SpellbookTable.cs')
if ($LASTEXITCODE -ne 0) { throw "Compile failed ($LASTEXITCODE)" }
Write-Host "Built $out"
