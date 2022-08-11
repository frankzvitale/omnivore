import * as AWS from 'aws-sdk'
import { buildLogger } from './logger'
import { SynthesizeSpeechInput } from 'aws-sdk/clients/polly'
import {
  generateUploadFilePathName,
  generateUploadSignedUrl,
  getFilePublicUrl,
  uploadToSignedUrl,
} from './uploads'

export interface TextToSpeechInput {
  id: string
  title: string
  text: string
  voice?: string
  textType?: 'text' | 'ssml'
  engine?: 'standard' | 'neural'
}

export interface TextToSpeechOutput {
  audioUrl: string
  speechMarks: string
}

const logger = buildLogger('app.dispatch')

// create a new AWS Polly client
const client = new AWS.Polly()

export const createAudio = async (
  input: TextToSpeechInput
): Promise<Buffer> => {
  const { text, voice, textType, engine } = input
  const params: SynthesizeSpeechInput = {
    OutputFormat: 'mp3',
    Text: text,
    TextType: textType || 'text',
    VoiceId: voice || 'Joanna',
    Engine: engine || 'neural',
  }
  try {
    const data = await client.synthesizeSpeech(params).promise()
    return data.AudioStream as Buffer
  } catch (error) {
    logger.error('Unable to create audio file', { error })
    throw error
  }
}

export const createSpeechMarks = async (
  input: TextToSpeechInput
): Promise<string> => {
  const { text, voice, textType, engine } = input
  const params: SynthesizeSpeechInput = {
    OutputFormat: 'json',
    Text: text,
    TextType: textType || 'text',
    VoiceId: voice || 'Joanna',
    Engine: engine || 'neural',
    SpeechMarkTypes: ['sentence', 'word'],
  }
  try {
    const data = await client.synthesizeSpeech(params).promise()
    return data.AudioStream as string
  } catch (error) {
    logger.error('Unable to create speech marks', { error })
    throw error
  }
}

export const createAudioWithSpeechMarks = async (
  input: TextToSpeechInput
): Promise<TextToSpeechOutput> => {
  try {
    const audio = await createAudio(input)
    // upload audio to google cloud storage
    logger.info('generating upload url...')
    const filePathName = generateUploadFilePathName(input.id, input.title)
    const contentType = 'audio/mpeg'
    const uploadUrl = await generateUploadSignedUrl(filePathName, contentType)

    logger.info('start uploading...', { uploadUrl })
    await uploadToSignedUrl(uploadUrl, audio, contentType)

    // get public url for audio file
    const publicUrl = getFilePublicUrl(filePathName)
    const speechMarks = await createSpeechMarks(input)
    return {
      audioUrl: publicUrl,
      speechMarks,
    }
  } catch (error) {
    logger.error('Unable to create audio with speech marks', { error })
    throw error
  }
}
