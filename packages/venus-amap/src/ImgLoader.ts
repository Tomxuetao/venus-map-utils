class ImgLoader {
  url: string
  onload: (img: HTMLImageElement) => void
  onerror: (url: string) => void
  maxRetries: number
  retryDelay: number
  currentAttempt: number
  called: boolean

  constructor(
    url: string,
    onload: (img: HTMLImageElement) => void,
    onerror: (url: string) => void,
    maxRetries: number = 3,
    retryDelay: number = 0
  ) {
    this.url = url
    this.onload = onload
    this.onerror = onerror
    this.maxRetries = maxRetries
    this.retryDelay = retryDelay
    this.currentAttempt = 0
    this.called = false
    this.loadImg()
  }

  loadImg(): void {
    const img: HTMLImageElement = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = this.url

    img.onload = (): void => {
      if (!this.called) {
        this.onload(img)
        this.called = true
      }
    }

    img.onerror = (): void => {
      this.currentAttempt++
      if (this.currentAttempt <= this.maxRetries && !this.called) {
        setTimeout(() => {
          this.loadImg()
        }, this.retryDelay)
      } else if (!this.called) {
        this.onerror(this.url)
        this.called = true
      }
    }
  }
}

export default ImgLoader
