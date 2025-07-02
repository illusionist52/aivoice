import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
});


export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('file');
    
    if (!audioFile) {
      return NextResponse.json({ message: 'No audio file provided' }, { status: 400 });
    }

    console.log("received file:", audioFile);
    const transcription = await groq.audio.transcriptions.create({
      file:audioFile,
      model: 'whisper-large-v3-turbo',
    });

    // Clean up temp file
    // fs.unlinkSync(tempFilePath);

    console.log('Transcription:', transcription);
    return NextResponse.json({ transcription });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ 
      message: 'An error occurred during transcription',
      error: error.message 
    }, { status: 500 });
  }
}
