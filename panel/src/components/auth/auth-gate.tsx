'use client'

import type { Session } from '@supabase/supabase-js'
import { Lock, ShieldCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { LogoMark } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { adminEmails, supabase } from '@/lib/supabase'

// Acceso al panel:
// 1. Correo y contraseña (usuario creado a mano en Supabase, sin registro público).
// 2. Segundo factor: código de 6 cifras de una app de autenticación. La primera vez se escanea un QR.
// Solo pasan las cuentas de NEXT_PUBLIC_ADMIN_EMAILS. La sesión es la misma que usa la web pública.
// Importante: esto controla la INTERFAZ. Los datos reales deben protegerse en la base de datos con RLS (ver README).

type Step =
  | { kind: 'loading' }
  | { kind: 'signin' }
  | { kind: 'forbidden'; email: string }
  | { kind: 'enroll'; factorId: string; qr: string; secret: string }
  | { kind: 'verify'; factorId: string }
  | { kind: 'ready' }

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<Step>({ kind: supabase ? 'loading' : 'ready' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supabase) return
    const sb = supabase
    let alive = true

    const resolve = async (session: Session | null) => {
      try {
        await check(session)
      } catch {
        // Sesión dañada o ilegible: se descarta y se pide entrar de nuevo (nunca se queda en «Comprobando…»).
        await sb.auth.signOut({ scope: 'local' }).catch(() => undefined)
        if (alive) setStep({ kind: 'signin' })
      }
    }

    const check = async (session: Session | null) => {
      if (!alive) return
      if (!session) return setStep({ kind: 'signin' })
      const email = session.user.email?.toLowerCase() ?? ''
      // La lista de cuentas con acceso vive en la base de datos (tabla admin_emails). Si la comprobación no responde, se usa la lista compilada.
      const { data: allowed, error: allowErr } = await sb.rpc('is_admin_email')
      if (allowErr ? !adminEmails.includes(email) : allowed !== true) return setStep({ kind: 'forbidden', email })

      const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal?.currentLevel === 'aal2') return alive && setStep({ kind: 'ready' })

      const { data: factors } = await sb.auth.mfa.listFactors()
      const verified = factors?.totp.find((f) => f.status === 'verified')
      if (verified) return alive && setStep({ kind: 'verify', factorId: verified.id })

      // Primera vez: se limpian altas a medias y se crea una nueva
      for (const f of factors?.all ?? []) if (f.status === 'unverified') await sb.auth.mfa.unenroll({ factorId: f.id })
      const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Panel SAREBIDEA' })
      if (error || !data) return alive && setError('No se ha podido preparar el segundo factor. Recarga la página.')
      if (alive) setStep({ kind: 'enroll', factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret })
    }

    sb.auth
      .getSession()
      .then(({ data }) => resolve(data.session))
      .catch(() => resolve(null))
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') resolve(session)
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const email = String(f.get('email') ?? '').trim()
    const password = String(f.get('password') ?? '')
    if (!email || !password) return setError('Escribe el correo y la contraseña.')
    setError('')
    setBusy(true)
    const { error } = await supabase!.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setError('Correo o contraseña incorrectos.')
    // Si va bien, onAuthStateChange (SIGNED_IN) pasa al siguiente paso
  }

  const verify = async (e: FormEvent<HTMLFormElement>, factorId: string, firstTime: boolean) => {
    e.preventDefault()
    const code = String(new FormData(e.currentTarget).get('code') ?? '').replace(/\s/g, '')
    if (!/^\d{6}$/.test(code)) return setError('El código tiene 6 cifras.')
    setError('')
    setBusy(true)
    const { error } = await supabase!.auth.mfa.challengeAndVerify({ factorId, code })
    setBusy(false)
    if (error) return setError(firstTime ? 'Código incorrecto. Comprueba que la app muestra la cuenta del panel y prueba con el código nuevo.' : 'Código incorrecto o caducado. Prueba con el siguiente.')
    setStep({ kind: 'ready' })
  }

  const signOut = async () => {
    await supabase?.auth.signOut()
    setStep({ kind: 'signin' })
  }

  if (step.kind === 'ready')
    return (
      <>
        {!supabase && (
          <div role="status" className="border-b bg-warning/12 px-4 py-1.5 text-center text-xs text-warning">
            Modo demostración: datos de ejemplo guardados en este navegador y sin inicio de sesión.
          </div>
        )}
        {children}
      </>
    )

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="size-11" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Panel SAREBIDEA</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acceso privado</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          {step.kind === 'loading' && <p className="py-6 text-center text-sm text-muted-foreground">Comprobando acceso…</p>}

          {step.kind === 'signin' && (
            <form onSubmit={signIn} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" name="email" type="email" autoComplete="username" defaultValue={adminEmails[0] ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" autoFocus />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                <Lock /> {busy ? 'Entrando…' : 'Entrar'}
              </Button>
            </form>
          )}

          {step.kind === 'forbidden' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                La cuenta <strong className="text-foreground">{step.email}</strong> no tiene permiso para entrar al panel.
              </p>
              <Button variant="outline" className="w-full" onClick={signOut}>
                Entrar con otra cuenta
              </Button>
            </div>
          )}

          {step.kind === 'enroll' && (
            <form onSubmit={(e) => verify(e, step.factorId, true)} noValidate className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="size-4 text-success" /> Activa el segundo factor
              </div>
              <ol className="space-y-1.5 text-sm text-muted-foreground">
                <li>1. Abre Google Authenticator, Authy o la app que uses.</li>
                <li>2. Añade una cuenta escaneando este código QR.</li>
                <li>3. Escribe el código de 6 cifras que muestra.</li>
              </ol>
              <div className="flex flex-col items-center gap-2 rounded-xl border bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={step.qr} alt="Código QR para la app de autenticación" className="size-40" />
                <details className="text-center text-xs text-muted-foreground">
                  <summary className="cursor-pointer">¿No puedes escanearlo?</summary>
                  <code className="mt-1 block break-all text-foreground select-all">{step.secret}</code>
                </details>
              </div>
              <CodeField />
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Comprobando…' : 'Activar y entrar'}
              </Button>
            </form>
          )}

          {step.kind === 'verify' && (
            <form onSubmit={(e) => verify(e, step.factorId, false)} noValidate className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="size-4 text-success" /> Código de verificación
              </div>
              <p className="text-sm text-muted-foreground">Escribe el código de 6 cifras de tu app de autenticación.</p>
              <CodeField />
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Comprobando…' : 'Entrar'}
              </Button>
              <button type="button" onClick={signOut} className="block w-full text-center text-xs text-muted-foreground hover:underline">
                Usar otra cuenta
              </button>
            </form>
          )}

          {error && (
            <p role="alert" className="mt-4 text-center text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <a href="/" className="hover:underline">
            ← Volver a la web
          </a>
        </p>
      </div>
    </div>
  )
}

function CodeField() {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="mfa-code">Código de 6 cifras</Label>
      <Input id="mfa-code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} autoFocus className="h-12 text-center text-xl tracking-[0.4em] tabular" />
    </div>
  )
}
