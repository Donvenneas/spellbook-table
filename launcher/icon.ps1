# The Spellbook Table icon, drawn with System.Drawing (our own drawing, no outside art):
# an armoured figure holding a glowing open spellbook against golden clouds.
# Everything is drawn on a 256-unit grid and scaled; sizes of 32 and below show just the book and its glow,
# which reads better in the taskbar and tray.
Add-Type -AssemblyName System.Drawing

function New-SpellbookIcon([int]$size) {
  $bmp = New-Object Drawing.Bitmap $size, $size
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.PixelOffsetMode = 'HighQuality'
  $g.Clear([Drawing.Color]::Transparent)
  $g.ScaleTransform($size / 256.0, $size / 256.0)
  $small = $size -le 32
  function C($r, $gg, $b, $a = 255) { [Drawing.Color]::FromArgb($a, $r, $gg, $b) }
  function P([float]$x, [float]$y) { [Drawing.PointF]::new($x, $y) }
  function Glow($x, $y, $w, $h, $inner) {
    $p = New-Object Drawing.Drawing2D.GraphicsPath
    $p.AddEllipse([float]$x, [float]$y, [float]$w, [float]$h)
    $br = New-Object Drawing.Drawing2D.PathGradientBrush $p
    $br.CenterColor = $inner
    $br.SurroundColors = [Drawing.Color[]]@([Drawing.Color]::FromArgb(0, $inner.R, $inner.G, $inner.B))
    $g.FillPath($br, $p); $br.Dispose(); $p.Dispose()
  }

  # Rounded square with a warm golden sky
  $frame = New-Object Drawing.Drawing2D.GraphicsPath
  $r = 52
  $frame.AddArc(2, 2, $r, $r, 180, 90); $frame.AddArc(254 - $r, 2, $r, $r, 270, 90)
  $frame.AddArc(254 - $r, 254 - $r, $r, $r, 0, 90); $frame.AddArc(2, 254 - $r, $r, $r, 90, 90); $frame.CloseFigure()
  $sky = New-Object Drawing.Drawing2D.LinearGradientBrush (P 0 0), (P 0 256), (C 246 205 108), (C 128 70 30)
  $g.FillPath($sky, $frame)
  $g.SetClip($frame)
  Glow 10 40 236 230 (C 255 240 190 230)

  if ($small) {
    # Book only, larger and centred
    $g.TranslateTransform(128, 132); $g.ScaleTransform(1.42, 1.42); $g.TranslateTransform(-128, -194)
  } else {
    # Clouds
    $cloud = New-Object Drawing.SolidBrush (C 112 62 28 80)
    foreach ($e in @(@(-40, 130, 120, 90), @(-30, 30, 100, 70), @(186, 120, 120, 96), @(196, 24, 100, 70), @(-30, 206, 316, 90), @(14, 90, 70, 50), @(176, 76, 70, 50))) {
      $g.FillEllipse($cloud, [float]$e[0], [float]$e[1], [float]$e[2], [float]$e[3])
    }
    # Cloak and body
    $g.FillPolygon((New-Object Drawing.SolidBrush (C 58 24 26)), [Drawing.PointF[]]@((P 64 256), (P 78 140), (P 104 108), (P 152 108), (P 178 140), (P 192 256)))
    $g.FillPolygon((New-Object Drawing.SolidBrush (C 150 34 30)), [Drawing.PointF[]]@((P 106 112), (P 150 112), (P 142 176), (P 114 176)))
    $g.FillPolygon((New-Object Drawing.SolidBrush (C 92 112 150)), [Drawing.PointF[]]@((P 112 112), (P 144 112), (P 128 150)))
    # Spiked pauldrons
    $steel = New-Object Drawing.Drawing2D.LinearGradientBrush (P 0 88), (P 0 142), (C 150 172 210), (C 46 62 104)
    $spike = New-Object Drawing.SolidBrush (C 40 46 70)
    $g.FillPolygon($spike, [Drawing.PointF[]]@((P 64 118), (P 48 80), (P 86 106)))
    $g.FillPolygon($spike, [Drawing.PointF[]]@((P 192 118), (P 208 80), (P 170 106)))
    $g.FillPolygon($spike, [Drawing.PointF[]]@((P 88 104), (P 86 78), (P 104 102)))
    $g.FillPolygon($spike, [Drawing.PointF[]]@((P 168 104), (P 170 78), (P 152 102)))
    $g.FillEllipse($steel, 54, 102, 62, 42)
    $g.FillEllipse($steel, 140, 102, 62, 42)
    # Head: face, swept-back dark hair, beard
    $g.FillEllipse((New-Object Drawing.SolidBrush (C 52 28 22)), 104, 44, 48, 40)
    $g.FillEllipse((New-Object Drawing.SolidBrush (C 198 140 104)), 110, 54, 36, 46)
    $g.FillPolygon((New-Object Drawing.SolidBrush (C 52 28 22)), [Drawing.PointF[]]@((P 112 84), (P 144 84), (P 136 108), (P 128 112), (P 120 108)))
    $g.FillEllipse((New-Object Drawing.SolidBrush (C 198 140 104)), 120, 84, 16, 8)
    $eye = New-Object Drawing.Pen (C 40 20 16), 3
    $g.DrawLine($eye, 117, 72, 125, 74); $g.DrawLine($eye, 131, 74, 139, 72)
    # Gauntlets at the book's edges
    $glove = New-Object Drawing.SolidBrush (C 50 64 100)
    $g.FillEllipse($glove, 34, 176, 26, 34); $g.FillEllipse($glove, 196, 176, 26, 34)
  }

  # Light pouring from the open pages
  Glow 40 96 176 120 (C 255 252 220 235)
  # Book cover, pages, spine and lines of text
  $cover = New-Object Drawing.Drawing2D.GraphicsPath
  $cover.AddBezier((P 128 178), (P 104 160), (P 68 158), (P 40 168)); $cover.AddLine((P 40 168), (P 48 236))
  $cover.AddBezier((P 48 236), (P 76 228), (P 108 230), (P 128 244)); $cover.AddBezier((P 128 244), (P 148 230), (P 180 228), (P 208 236))
  $cover.AddLine((P 208 236), (P 216 168)); $cover.AddBezier((P 216 168), (P 188 158), (P 152 160), (P 128 178)); $cover.CloseFigure()
  $g.FillPath((New-Object Drawing.SolidBrush (C 96 46 20)), $cover)
  $pageBrush = New-Object Drawing.Drawing2D.LinearGradientBrush (P 0 160), (P 0 236), (C 255 250 222), (C 238 204 128)
  foreach ($side in -1, 1) {
    $pg = New-Object Drawing.Drawing2D.GraphicsPath
    $o = 128 + $side * 82; $m = 128 + $side * 50; $n = 128 + $side * 22
    $pg.AddBezier((P 128 172), (P $n 156), (P $m 154), (P $o 162)); $pg.AddLine((P $o 162), (P (128 + $side * 76) 226))
    $pg.AddBezier((P (128 + $side * 76) 226), (P $m 220), (P $n 222), (P 128 234)); $pg.CloseFigure()
    $g.FillPath($pageBrush, $pg); $pg.Dispose()
  }
  $g.DrawLine((New-Object Drawing.Pen (C 150 96 44), 3), 128, 172, 128, 234)
  if (-not $small) {
    $ink = New-Object Drawing.Pen (C 170 122 64 170), 2.4
    foreach ($i in 0..4) {
      $y = 176 + $i * 10
      $g.DrawBezier($ink, (P 64 ($y - 4)), (P 84 ($y - 8)), (P 102 ($y - 7)), (P 120 ($y + 2)))
      $g.DrawBezier($ink, (P 136 ($y + 2)), (P 154 ($y - 7)), (P 172 ($y - 8)), (P 192 ($y - 4)))
    }
  }
  $g.ResetClip(); $g.ResetTransform(); $g.ScaleTransform($size / 256.0, $size / 256.0)
  $g.DrawPath((New-Object Drawing.Pen (C 70 36 12 200), ([Math]::Max(4, 512.0 / $size))), $frame)
  $g.Dispose()
  return $bmp
}
