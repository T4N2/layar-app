import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Menahan error render supaya satu komponen rusak tidak mengosongkan seluruh halaman. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[LAYAR] render error', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="crash">
        <h2>Ada yang error</h2>
        <p>Bagian ini gagal ditampilkan. Sisa aplikasi masih bisa dipakai.</p>
        <pre>{error.message}</pre>
        <button type="button" className="btn btn-primary" onClick={() => this.setState({ error: null })}>
          Coba lagi
        </button>
      </div>
    )
  }
}
