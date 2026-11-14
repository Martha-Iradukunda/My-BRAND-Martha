<?php
// One-off: shrink the site's photos for the web (same pictures, smaller files) and add the founder photos.
// Run with any PHP that has GD:  php tools/optimize-images.php <path to MARITA folder>
$img = __DIR__ . '/../site/img/';
$marita = rtrim($argv[1] ?? 'C:/PROJECTS_apps/MARITA', '/') . '/';

function save_jpeg($src, string $dest, int $maxW, int $maxH, int $q = 80): void {
    $w = imagesx($src); $h = imagesy($src);
    $s = min(1, $maxW / $w, $maxH / $h);
    $nw = (int) round($w * $s); $nh = (int) round($h * $s);
    $d = imagecreatetruecolor($nw, $nh);
    imagefill($d, 0, 0, imagecolorallocate($d, 255, 255, 255));
    imagecopyresampled($d, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
    imageinterlace($d, true);
    imagejpeg($d, $dest, $q);
    printf("%-28s %4dx%-4d %4d KB\n", basename($dest), $nw, $nh, filesize($dest) / 1024);
}

// photos already on the site: same file names, web size
foreach (glob($img . '*.{jpg,jpeg,jfif}', GLOB_BRACE) as $f) {
    if (filesize($f) < 250 * 1024 && !str_ends_with($f, '.jfif')) continue;
    $src = @imagecreatefromstring(file_get_contents($f));
    if (!$src) { echo "skip ", basename($f), "\n"; continue; }
    $dest = preg_replace('/\.jfif$/', '.jpg', $f);
    save_jpeg($src, $dest, 1600, 1600, 78);
    if ($dest !== $f) unlink($f);
}
// the founder's photos
foreach (['founder1', 'founder2', 'founder3'] as $n) {
    $src = imagecreatefromstring(file_get_contents($marita . $n . '.jpg'));
    save_jpeg($src, $img . $n . '.jpg', 1400, 1500, 80);
}
