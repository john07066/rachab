import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const outputRoot = path.resolve('backend/output');

export async function renderApprovedClips({ video, clips, options = {} }) {
  if (!video?.sourceUrl) throw new Error('Video source URL is required for rendering');
  if (!clips?.length) throw new Error('No approved clips to render');

  await ensureBinaries(['yt-dlp', 'ffmpeg']);

  const renderOptions = {
    aspectRatio: options.aspectRatio || '9:16',
    burnSubtitles: options.burnSubtitles ?? true,
    autoBroll: options.autoBroll ?? true
  };

  const videoDir = path.join(outputRoot, sanitize(video.id));
  await fs.mkdir(videoDir, { recursive: true });

  const sourcePath = path.join(videoDir, 'source.mp4');
  await downloadSource(video.sourceUrl, sourcePath);

  const rendered = [];
  for (const [index, clip] of clips.entries()) {
    const base = `${String(index + 1).padStart(2, '0')}_${sanitize(clip.title).slice(0, 50)}`;
    const targetPath = path.join(videoDir, `${base}.mp4`);
    const srtPath = path.join(videoDir, `${base}.srt`);

    if (renderOptions.burnSubtitles) {
      await writeSrt(srtPath, clip.startSecond, clip.endSecond, clip.hook);
    }

    await renderClip(sourcePath, targetPath, clip, srtPath, renderOptions);

    rendered.push({
      clipId: clip.id,
      outputPath: targetPath,
      timestamp: clip.timestamp,
      title: clip.title,
      description: clip.caption,
      aspectRatio: renderOptions.aspectRatio
    });
  }

  return { videoId: video.id, sourcePath, renderedCount: rendered.length, clips: rendered };
}

async function ensureBinaries(binaries) {
  for (const binary of binaries) {
    try {
      await run('which', [binary]);
    } catch {
      throw new Error(`${binary} is not installed. Install it to enable video rendering.`);
    }
  }
}

async function downloadSource(url, outputPath) {
  await run('yt-dlp', ['-f', 'mp4/best', '-o', outputPath, url]);
}

async function renderClip(inputPath, outputPath, clip, srtPath, options) {
  const duration = Math.max(1, clip.endSecond - clip.startSecond);
  const vf = buildVideoFilter(options, srtPath);

  await run('ffmpeg', [
    '-y',
    '-ss', String(clip.startSecond),
    '-i', inputPath,
    '-t', String(duration),
    '-vf', vf,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '23',
    '-c:a', 'aac',
    '-movflags', '+faststart',
    outputPath
  ]);
}

function buildVideoFilter(options, srtPath) {
  const filters = [];

  if (options.aspectRatio === '9:16') {
    filters.push('scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920');
  } else {
    filters.push('scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080');
  }

  if (options.autoBroll) {
    filters.push('zoompan=z=if(lte(zoom,1.0),1.08,zoom-0.0005):d=125');
  }

  if (options.burnSubtitles) {
    const safePath = srtPath.replace(/:/g, '\\:');
    filters.push(`subtitles='${safePath}'`);
  }

  return filters.join(',');
}

async function writeSrt(filePath, startSec, endSec, text) {
  const content = `1\n${toSrt(startSec)} --> ${toSrt(endSec)}\n${text}\n`;
  await fs.writeFile(filePath, content, 'utf8');
}

function toSrt(seconds) {
  const sec = Math.max(0, Math.floor(seconds));
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${s},000`;
}

function sanitize(value) {
  return String(value).replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase();
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'pipe' });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => reject(error));
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}
