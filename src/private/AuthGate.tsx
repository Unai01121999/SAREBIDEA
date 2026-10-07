import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { adminEmails, supabase } from '../lib/supabase'
import { Icon } from '../components/ui/Icon'

// Acceso al Área privada en producción:
// 1. Inicio de sesión con Google (OAuth).
// 2. Segundo factor: código de 6 cifras de una app de autenticación (Google Authenticator, Authy…).
//    La primera vez se escanea un QR; después solo se pide el código.
// Solo pasan las cuentas de VITE_ADMIN_EMAILS (por defecto sarebidea@sarebidea.com). La base de datos
// exige además sesión con segundo factor (aal2) y correo autorizado, así que saltarse esta pantalla no da acceso.

type Step =
  | { kind: 'loading' }
  | { kind: 'signin' }
  | { kind: 'forbidden'; email: string }
  | { kind: 'enroll'; factorId: string; qr: string; secret: string }
  | { kind: 'verify'; factorId: string }

export const REDIRECT_PARAM = 'acceso'

export function AuthGate({ onReady }: { onReady: () => void }) {
  const [step, setStep] = useState<Step>({ kind: 'loading' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) return
    const sb = supabase
    let alive = true

    const resolve = async (session: Session | null) => {
      if (!alive) return
      if (!session) return setStep({ kind: 'signin' })
      const email = session.user.email?.toLowerCase() ?? ''
      if (!adminEmails.includes(email)) return setStep({ kind: 'forbidden', email })

      const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal?.currentLevel === 'aal2') return alive && onReady()

      const { data: factors } = await sb.auth.mfa.listFactors()
      const verified = factors?.totp.find((f) => f.status === 'verified')
      if (verified) return alive && setStep({ kind: 'verify', factorId: verified.id })

      // Primera vez: limpiamos altas a medias y creamos una nueva
      for (const f of factors?.all ?? []) if (f.status === 'unverified') await sb.auth.mfa.unenroll({ factorId: f.id })
      const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Área privada SAREBIDEA' })
      if (error || !data) return alive && setError('No se ha podido preparar el segundo factor. Recarga la página.')
      if (alive) setStep({ kind: 'enroll', factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret })
    }

    sb.auth.getSession().then(({ data }) => {
      // Al volver de Google (la sesión ya está creada), limpiamos la URL
      const params = new URLSearchParams(window.location.search)
      if (params.has(REDIRECT_PARAM) || params.has('code')) {
        params.delete(REDIRECT_PARAM)
        params.delete('code')
        const q = params.toString()
        history.replaceState(null, '', `${window.location.pathname}${q ? `?${q}` : ''}#area-privada`)
      }
      resolve(data.session)
    })
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') resolve(session)
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [onReady])

  const signIn = async () => {
    setError('')
    const { error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${window.location.pathname}?${REDIRECT_PARAM}=privada`,
        queryParams: { prompt: 'select_account', login_hint: adminEmails[0] ?? '' },
      },
    })
    if (error) setError('No se ha podido abrir el inicio de sesión de Google.')
  }

  const signOut = async () => {
    await supabase?.auth.signOut()
    setStep({ kind: 'signin' })
  }

  const verify = async (e: FormEvent<HTMLFormElement>, factorId: string, firstTime: boolean) => {
    e.preventDefault()
    const code = String(new FormData(e.currentTarget).get('code') ?? '').replace(/\s/g, '')
    if (!/^\d{6}$/.test(code)) return setError('El código tiene 6 cifras.')
    setError('')
    const { error } = await supabase!.auth.mfa.challengeAndVerify({ factorId, code })
    if (error) return setError(firstTime ? 'Código incorrecto. Revisa que la app muestre la cuenta de SAREBIDEA y prueba con el código nuevo.' : 'Código incorrecto o caducado. Prueba con el siguiente.')
    onReady()
  }

  if (!supabase) return null

  return (
    <div className="mx-auto max-w-md py-16 sm:py-24">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-ink text-paper">
        <Icon name={step.kind === 'enroll' || step.kind === 'verify' ? 'shield' : 'lock'} size={24} />
      </span>

      {step.kind === 'loading' && <p className="mt-8 text-center text-mute">Comprobando acceso…</p>}

      {step.kind === 'signin' && (
        <div className="text-center">
          <h1 className="mt-6 font-display text-[2rem] font-semibold tracking-[-0.03em]">Área privada</h1>
          <p className="mt-3 text-mute">Entra con la cuenta de Google de SAREBIDEA. Después te pediremos un código de tu app de autenticación.</p>
          <button
            type="button"
            onClick={signIn}
            className="mt-8 inline-flex h-12 w-full items-center justify-center gap-3 rounded-full bg-white font-medium text-ink ring-1 ring-line transition-[scale] duration-150 hover:bg-ink/[0.03] active:scale-[0.98]"
          >
            <GoogleMark /> Continuar con Google
          </button>
        </div>
      )}

      {step.kind === 'forbidden' && (
        <div className="text-center">
          <h1 className="mt-6 font-display text-[2rem] font-semibold tracking-[-0.03em]">Sin acceso</h1>
          <p className="mt-3 text-mute">
            La cuenta <strong className="text-ink">{step.email}</strong> no tiene permiso para entrar. Usa {adminEmails[0]}.
          </p>
          <button type="button" onClick={signOut} className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-ink px-6 font-medium text-paper">
            Entrar con otra cuenta
          </button>
        </div>
      )}

      {step.kind === 'enroll' && (
        <form onSubmit={(e) => verify(e, step.factorId, true)} noValidate>
          <h1 className="mt-6 text-center font-display text-[1.8rem] font-semibold tracking-[-0.03em]">Activa el segundo factor</h1>
          <ol className="mt-6 space-y-3 text-[0.98rem] text-ink-2">
            <li>1. Abre Google Authenticator, Authy o la app de autenticación que uses.</li>
            <li>2. Añade una cuenta escaneando este código QR.</li>
            <li>3. Escribe el código de 6 cifras que te muestra.</li>
          </ol>
          <div className="mt-6 flex flex-col items-center gap-3 rounded-[24px] bg-white p-6 ring-1 ring-line">
            <img src={step.qr} alt="Código QR para la app de autenticación" className="size-48" />
            <details className="text-center text-[13px] text-mute">
              <summary className="cursor-pointer">¿No puedes escanearlo?</summary>
              <p className="mt-2">Introduce esta clave a mano:</p>
              <code className="mt-1 block break-all text-ink select-all">{step.secret}</code>
            </details>
          </div>
          <CodeField error={error} />
          <button type="submit" className="mt-4 h-12 w-full rounded-full bg-ink font-medium text-paper active:scale-[0.98]">
            Activar y entrar
          </button>
        </form>
      )}

      {step.kind === 'verify' && (
        <form onSubmit={(e) => verify(e, step.factorId, false)} noValidate className="text-center">
          <h1 className="mt-6 font-display text-[1.8rem] font-semibold tracking-[-0.03em]">Código de verificación</h1>
          <p className="mt-3 text-mute">Escribe el código de 6 cifras de tu app de autenticación.</p>
          <CodeField error={error} />
          <button type="submit" className="mt-4 h-12 w-full rounded-full bg-ink font-medium text-paper active:scale-[0.98]">
            Entrar
          </button>
          <button type="button" onClick={signOut} className="mt-3 text-[14px] text-mute underline-offset-2 hover:underline">
            Usar otra cuenta
          </button>
        </form>
      )}

      {error && step.kind !== 'enroll' && step.kind !== 'verify' && (
        <p role="alert" className="mt-6 text-center text-[#c23237]">
          {error}
        </p>
      )}
    </div>
  )
}

function CodeField({ error }: { error: string }) {
  return (
    <div className="mt-6 text-left">
      <label htmlFor="mfa-code" className="mb-1.5 block text-sm text-ink-2">
        Código de 6 cifras
      </label>
      <input
        id="mfa-code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={7}
        autoFocus
        aria-invalid={!!error}
        aria-describedby={error ? 'mfa-err' : undefined}
        className="h-14 w-full rounded-xl bg-white px-4 text-center font-display text-[1.6rem] tracking-[0.4em] ring-1 ring-line tabular focus:ring-2 focus:ring-cobalt focus:outline-none aria-[invalid=true]:ring-[#e5484d]"
      />
      {error && (
        <p id="mfa-err" role="alert" className="mt-2 text-[13.5px] text-[#c23237]">
          {error}
        </p>
      )}
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
