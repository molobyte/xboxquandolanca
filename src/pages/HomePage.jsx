import SmartSearch from '../components/SmartSearch.jsx';
import XboxLogo from '../components/XboxLogo.jsx';

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5">
      {/* Fundo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-xbox-green/25 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#07090d_75%)]" />
        <div className="absolute inset-0 bg-grid opacity-[0.07]" />
      </div>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center -mt-24">
        <XboxLogo className="h-14 w-14 text-xbox-neon drop-shadow-[0_0_25px_rgba(82,214,39,0.6)]" />
        <h1 className="mt-6 text-center font-title text-4xl font-light tracking-tight sm:text-6xl">
          Quando lança<span className="text-xbox-neon font-normal">?</span>
        </h1>
        <p className="mt-3 max-w-md text-center font-sans text-white/60">
          Procure qualquer jogo da loja Xbox e veja quantas horas faltam para ele chegar.
        </p>

        <div className="mt-10 w-full">
          <SmartSearch size="lg" autoFocus />
        </div>

        <p className="mt-4 text-center text-xs text-white/35">
          Ex.: “Forza Horizon”, ou cole um link como{' '}
          <span className="font-mono text-white/50">xbox.com/pt-BR/games/store/…/9NXXXXXXXXXX</span>
        </p>
      </div>

      <footer className="absolute bottom-5 text-xs text-white/25">
        Dados da Microsoft Store (mercado BR). Projeto não oficial.
      </footer>
    </main>
  );
}
