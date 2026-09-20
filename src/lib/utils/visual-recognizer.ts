import * as tf from '@tensorflow/tfjs'
import * as mobilenet from '@tensorflow-models/mobilenet'

export interface VisualRecognitionResult {
  className: string
  probability: number
  suggestedCategory: string
  suggestedPrice: number
}

const CATEGORY_MAP: Record<string, string> = {
  banana: 'frutas',
  apple: 'frutas',
  orange: 'frutas',
  lemon: 'frutas',
  'granny smith': 'frutas',
  pineapple: 'frutas',
  strawberry: 'frutas',
  tomato: 'vegetales',
  'bell pepper': 'vegetales',
  cucumber: 'vegetales',
  lettuce: 'vegetales',
  broccoli: 'vegetales',
  carrot: 'vegetales',
  potato: 'vegetales',
  onion: 'vegetales',
  garlic: 'vegetales',
  'sweet potato': 'vegetales',
  'hot dog': 'alimentos_procesados',
  pizza: 'alimentos_procesados',
  hamburger: 'alimentos_procesados',
  'ice cream': 'alimentos_procesados',
  'pretzel': 'alimentos_procesados',
  'cheeseburger': 'alimentos_procesados',
  'chocolate sauce': 'alimentos_procesados',
  'mashed potato': 'alimentos_procesados',
  'cupcake': 'alimentos_procesados',
  'orange juice': 'bebidas',
  'beer bottle': 'bebidas',
  'beer glass': 'bebidas',
  'espresso': 'bebidas',
  'coffee mug': 'bebidas',
  'milk': 'lacteos',
  'yogurt': 'lacteos',
  'cheese': 'lacteos',
  'bread': 'panaderia',
  'bagel': 'panaderia',
  'croissant': 'panaderia',
  'french loaf': 'panaderia',
}

const DEFAULT_PRICES: Record<string, number> = {
  frutas: 1.50,
  vegetales: 1.20,
  alimentos_procesados: 2.50,
  bebidas: 1.80,
  lacteos: 3.00,
  panaderia: 1.00,
}

export class VisualRecognizer {
  private model: mobilenet.MobileNet | null = null
  private isLoaded: boolean = false

  async loadModel(): Promise<void> {
    if (this.isLoaded) return

    await tf.setBackend('webgl')
    await tf.ready()

    this.model = await mobilenet.load({ version: 2, alpha: 0.50 })
    this.isLoaded = true
  }

  async recognize(imageElement: HTMLImageElement | HTMLVideoElement): Promise<VisualRecognitionResult[]> {
    if (!this.model || !this.isLoaded) {
      await this.loadModel()
    }

    const predictions = await this.model!.classify(imageElement)

    return predictions.map((pred) => {
      const className = pred.className.toLowerCase().split(',')[0].trim()
      const suggestedCategory = CATEGORY_MAP[className] || 'otros'
      const suggestedPrice = DEFAULT_PRICES[suggestedCategory] || 0

      return {
        className,
        probability: pred.probability,
        suggestedCategory,
        suggestedPrice,
      }
    })
  }

  async recognizeFromCamera(videoElement: HTMLVideoElement): Promise<VisualRecognitionResult[]> {
    return this.recognize(videoElement)
  }

  async recognizeFromImage(imageFile: File): Promise<VisualRecognitionResult[]> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = async () => {
        try {
          const results = await this.recognize(img)
          resolve(results)
        } catch (error) {
          reject(error)
        }
        URL.revokeObjectURL(img.src)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(imageFile)
    })
  }

  static getCategoryDisplayName(category: string): string {
    const displayNames: Record<string, string> = {
      frutas: 'Frutas',
      vegetales: 'Vegetales',
      alimentos_procesados: 'Alimentos Procesados',
      bebidas: 'Bebidas',
      lacteos: 'Lácteos',
      panaderia: 'Panadería',
      otros: 'Otros',
    }
    return displayNames[category] || category
  }

  dispose(): void {
    if (this.model) {
      tf.dispose()
      this.isLoaded = false
    }
  }
}

export const visualRecognizer = new VisualRecognizer()
