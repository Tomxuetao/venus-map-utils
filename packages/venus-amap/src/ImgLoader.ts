class ImgLoader {
  url: string
  onload: (img: HTMLImageElement) => void
  onerror: (url: string) => void
  called: boolean

  constructor(
    url: string,
    onload: (img: HTMLImageElement) => void,
    onerror: (url: string) => void
  ) {
    this.url = url
    this.onload = onload
    this.onerror = onerror
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
      this.onerror(this.url)
      this.called = true
    }
  }
}

export default ImgLoader
