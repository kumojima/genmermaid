import { useCallback, useEffect, useState } from 'react'
import mermaid from 'mermaid'
import './App.css'

const starterDiagram = `flowchart TD
  A[アイデア] --> B{選択}
  B -->|はい| C[実行]
  B -->|いいえ| D[見直す]
  D --> A
  C --> E[完了]`

mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' })

function App() {
  const [source, setSource] = useState(starterDiagram)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')
  const [isRendering, setIsRendering] = useState(false)

  const renderDiagram = useCallback(async () => {
    if (!source.trim()) {
      setError('Mermaid記法を入力してください。')
      setSvg('')
      return
    }

    setIsRendering(true)
    setError('')
    try {
      const { svg: renderedSvg } = await mermaid.render(`diagram-${Date.now()}`, source)
      setSvg(renderedSvg)
    } catch (renderError) {
      setSvg('')
      setError('図を生成できませんでした。記法を確認してください。')
      console.error(renderError)
    } finally {
      setIsRendering(false)
    }
  }, [source])

  const downloadDiagram = () => {
    if (!svg) return

    const image = new Image()
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const objectUrl = URL.createObjectURL(svgBlob)
    image.onload = () => {
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth * scale
      canvas.height = image.naturalHeight * scale
      const context = canvas.getContext('2d')
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      canvas.toBlob((blob) => {
        if (!blob) return
        const link = document.createElement('a')
        const downloadUrl = URL.createObjectURL(blob)
        link.href = downloadUrl
        link.download = 'mermaid-diagram.png'
        link.click()
        URL.revokeObjectURL(downloadUrl)
      }, 'image/png')
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      setError('画像の書き出しに失敗しました。')
    }
    image.src = objectUrl
  }

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        renderDiagram()
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [renderDiagram])

  return (
    <main className="app-shell">
      <section className="workspace" id="top">
        <div className="panels">
          <section className="panel editor-panel" aria-labelledby="editor-title">
            <div className="panel-heading">
              <div className="heading-label"><span className="step-number">01</span><div><h2 id="editor-title">エディター</h2><p>Mermaid 記法を入力</p></div></div>
              <span className="language-tag"><span /> MERMAID</span>
            </div>
            <div className="editor-wrap">
              <div className="line-numbers" aria-hidden="true">{source.split('\n').map((_, index) => <span key={index}>{String(index + 1).padStart(2, '0')}</span>)}</div>
              <textarea
                aria-label="Mermaid記法"
                spellCheck="false"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder="flowchart TD&#10;  A[Start] --> B[End]"
              />
            </div>
            <div className="editor-footer"><span><kbd>Ctrl</kbd> + <kbd>Enter</kbd> でプレビュー</span><span>{source.split('\n').length} 行</span></div>
            <button className="preview-button" type="button" onClick={renderDiagram} disabled={isRendering}>
              {isRendering ? <span className="spinner" /> : <span className="button-icon">↗</span>}
              {isRendering ? '生成中…' : 'プレビューを生成'}
            </button>
          </section>

          <section className="panel preview-panel" aria-labelledby="preview-title">
            <div className="panel-heading">
              <div className="heading-label"><span className="step-number">02</span><div><h2 id="preview-title">プレビュー</h2><p>生成されたダイアグラム</p></div></div>
              <span className="preview-badge">LIVE VIEW</span>
            </div>
            <div className={`preview-canvas ${svg ? 'has-diagram' : ''}`}>
              {svg ? <div className="diagram" dangerouslySetInnerHTML={{ __html: svg }} /> : (
                <div className="empty-state">
                  <div className="empty-art" aria-hidden="true"><span className="node node-a" /><span className="connector connector-a" /><span className="node node-b" /><span className="connector connector-b" /><span className="node node-c" /><span className="sparkle">✳</span></div>
                  <h3>ここに図が表示されます</h3>
                  <p>左のエディターに記法を入力して<br />プレビューを生成してください。</p>
                </div>
              )}
              {error && <div className="error-message" role="alert"><span>!</span>{error}</div>}
            </div>
            <div className="preview-footer"><span><span className="canvas-dot" /> キャンバス</span><span>Mermaid.js</span></div>
            <button className="download-button" type="button" onClick={downloadDiagram} disabled={!svg}>
              <span aria-hidden="true">↓</span> 画像をダウンロード
            </button>
          </section>
        </div>
      </section>
    </main>
  )
}

export default App
