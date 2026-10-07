import { useEffect, useState, type FormEvent } from 'react'
import QRCode from 'qrcode'
import { getDb } from '../lib/leads'
import { otpauthUri, randomSecret, verifyTotp } from '../lib/totp'
import { brand } from '../data/site'
import { Icon } from '../components/ui/Icon'

// Segundo factor de la vista previa (sin Supabase): además de la cuenta de claude.ai, se pide el
// código de 6 cifras de una app de autenticación. La clave vive en la base de datos del artifact
// (solo la lee el propietario); en desarrollo local, en localStorage.
// La sesión dura 8 horas o hasta pulsar "Cerrar sesión".

const LOCAL_SECRET = 'sarebidea-totp'
const UNLOCK_KEY = 'sarebidea-unlock'
const SESSION_MS = 8 * 60 * 60 * 1000

export function isUnlocked(): boolean {
  try {
    return Number(sessionStorage.getItem(UNLOCK_KEY) ?? 0) > Date.now()
  } catch {
    return false
  }
}
export function lock() {
  try {
    sessionStorage.removeItem(UNLOCK_KEY)
  } catch {
    /* sin almacenamiento */
  }
}
function unlock() {
  try {
    sessionStorage.setItem(UNLOCK_KEY, String(Date.now() + SESSION_MS))
  } catch {
    /* sin almacenamiento: la sesión dura lo que la pestaña */
  }
}

async function loadSecret(): Promise<string | null> {
  const db = await getDb()
  if (db) {
    const snap = await db.collection('seguridad').doc('totp').get()
    return snap.exists ? (snap.data()?.secret as string) ?? null : null
  }
  try {
    return localStorage.getItem(LOCAL_SECRET)
  } catch {
    return null
  }
}
async function saveSecret(secret: string) {
  const db = await getDb()
  if (db) return db.collection('seguridad').doc('totp').set({ secret, createdAt: new Date().toISOString() })
  localStorage.setItem(LOCAL_SECRET, secret)
}

type Step = { kind: 'loading' } | { kind: 'enroll'; secret: string; qr: string } | { kind: 'verify'; secret: string } | { kind: 'error' }

export function PreviewLock({ onReady }: { onReady: () => void }) {
  const [step, setStep] = useState<Step>({ kind: 'loading' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isUnlocked()) return onReady()
    let alive = true
    loadSecret()
      .then(async (stored) => {
        if (!alive) return
        if (stored) return setStep({ kind: 'verify', secret: stored })
        const secret = randomSecret()
        const qr = await QRCode.toDataURL(otpauthUri(secret, brand.email), { margin: 1, width: 384, color: { dark: '#0d0e12', light: '#ffffff' } })
        if (alive) setStep({ kind: 'enroll', secret, qr })
      })
      .catch(() => alive && setStep({ kind: 'error' }))
    return () => {
      alive = false
    }
  }, [onReady])

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (step.kind !== 'enroll' && step.kind !== 'verify') return
    const code = String(new FormData(e.currentTarget).get('code') ?? '')
    setBusy(true)
    setError('')
    try {
      if (!(await verifyTotp(step.secret, code))) {
        setError(step.kind === 'enroll' ? 'Código incorrecto. Comprueba que has añadido la cuenta SAREBIDEA y escribe el código que se ve ahora.' : 'Código incorrecto o caducado. Prueba con el siguiente.')
        return
      }
      if (step.kind === 'enroll') await saveSecret(step.secret)
      unlock()
      onReady()
    } catch {
      setError('No se ha podido guardar. Revisa tu conexión e inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md py-12 sm:py-20">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-ink text-paper">
        <Icon name="shield" size={24} />
      </span>

      {step.kind === 'loading' && <p className="mt-8 text-center text-mute">Comprobando acceso…</p>}
      {step.kind === 'error' && <p className="mt-8 text-center text-[#c23237]">No se ha podido comprobar el acceso. Recarga la página.</p>}

      {(step.kind === 'enroll' || step.kind === 'verify') && (
        <form onSubmit={submit} noValidate>
          {step.kind === 'enroll' ? (
            <>
              <h1 className="mt-6 text-center font-display text-[1.8rem] font-semibold tracking-[-0.03em]">Activa la verificación en dos pasos</h1>
              <ol className="mt-6 space-y-2.5 text-[0.98rem] text-ink-2">
                <li>1. Abre Google Authenticator, Authy o tu app de autenticación.</li>
                <li>2. Añade una cuenta escaneando este código QR.</li>
                <li>3. Escribe el código de 6 cifras que aparece.</li>
              </ol>
              <div className="mt-6 flex flex-col items-center gap-3 rounded-[24px] bg-white p-6 ring-1 ring-line">
                <img src={step.qr} alt="Código QR para añadir SAREBIDEA a tu app de autenticación" className="size-48" />
                <details className="text-center text-[13px] text-mute">
                  <summary className="cursor-pointer">¿No puedes escanearlo?</summary>
                  <p className="mt-2">Introduce esta clave a mano:</p>
                  <code className="mt-1 block break-all text-ink select-all">{step.secret.match(/.{1,4}/g)?.join(' ')}</code>
                </details>
              </div>
            </>
          ) : (
            <div className="text-center">
              <h1 className="mt-6 font-display text-[1.8rem] font-semibold tracking-[-0.03em]">Código de verificación</h1>
              <p className="mt-3 text-mute">Escribe el código de 6 cifras de tu app de autenticación (cuenta SAREBIDEA).</p>
            </div>
          )}
          <div className="mt-6">
            <label htmlFor="lock-code" className="mb-1.5 block text-sm text-ink-2">
              Código de 6 cifras
            </label>
            <input
              id="lock-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={7}
              autoFocus
              aria-invalid={!!error}
              aria-describedby={error ? 'lock-err' : undefined}
              className="h-14 w-full rounded-xl bg-white px-4 text-center font-display text-[1.6rem] tracking-[0.4em] ring-1 ring-line tabular focus:ring-2 focus:ring-cobalt focus:outline-none aria-[invalid=true]:ring-[#e5484d]"
            />
            {error && (
              <p id="lock-err" role="alert" className="mt-2 text-[13.5px] text-[#c23237]">
                {error}
              </p>
            )}
          </div>
          <button type="submit" disabled={busy} className="mt-4 h-12 w-full rounded-full bg-ink font-medium text-paper transition-[scale,opacity] active:scale-[0.98] disabled:opacity-60">
            {busy ? 'Comprobando…' : step.kind === 'enroll' ? 'Activar y entrar' : 'Entrar'}
          </button>
        </form>
      )}
    </div>
  )
}
