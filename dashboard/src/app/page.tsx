import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐾</span>
              <span className="font-bold text-xl">Donations Plugin</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">
                Funkcje
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">
                Cennik
              </a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900">
                FAQ
              </a>
            </nav>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Zaloguj się
              </Link>
              <Link
                href="/register"
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-full font-medium transition-colors"
              >
                Rozpocznij za darmo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span>✨</span>
            <span>7 dni za darmo • Bez ukrytych opłat</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Widget donacyjny dla{" "}
            <span className="text-primary-500">fundacji</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Profesjonalny widget do zbierania wpłat na Twojej stronie Framer lub
            WordPress. Integracja ze Stripe, panel zarządzania i szczegółowe
            statystyki.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-colors shadow-lg shadow-primary-500/25"
            >
              Wypróbuj za darmo →
            </Link>
            <a
              href="#demo"
              className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-full font-semibold text-lg transition-colors border border-gray-200"
            >
              Zobacz demo
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Wszystko, czego potrzebujesz
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Kompletne rozwiązanie do zbierania wpłat dla organizacji non-profit
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              emoji="💳"
              title="Płatności Stripe"
              description="Bezpieczne płatności kartą. Podłącz własne konto Stripe i otrzymuj wpłaty bezpośrednio."
            />
            <FeatureCard
              emoji="🎨"
              title="Pełna personalizacja"
              description="Dostosuj kolory, kwoty i teksty. Widget wygląda jak część Twojej strony."
            />
            <FeatureCard
              emoji="📊"
              title="Szczegółowe statystyki"
              description="Śledź wpłaty w czasie rzeczywistym. Eksportuj dane do CSV."
            />
            <FeatureCard
              emoji="🖼️"
              title="Wiele zbiórek"
              description="Prowadź nieograniczoną liczbę zbiórek jednocześnie."
            />
            <FeatureCard
              emoji="📧"
              title="Powiadomienia email"
              description="Automatyczne podziękowania dla darczyńców i alerty dla Ciebie."
            />
            <FeatureCard
              emoji="🔒"
              title="Bezpieczeństwo"
              description="Szyfrowanie SSL, zgodność z RODO. Twoje dane są bezpieczne."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Prosty cennik
            </h2>
            <p className="text-xl text-gray-600">
              Wybierz plan dopasowany do Twoich potrzeb
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Monthly Plan */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <div className="text-center mb-8">
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Miesięcznie
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-gray-900">49</span>
                  <span className="text-xl text-gray-600">zł/mies.</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <PricingFeature>Nieograniczona liczba zbiórek</PricingFeature>
                <PricingFeature>Panel zarządzania</PricingFeature>
                <PricingFeature>Integracja Stripe Connect</PricingFeature>
                <PricingFeature>Statystyki i raporty</PricingFeature>
                <PricingFeature>Wsparcie email</PricingFeature>
              </ul>
              <Link
                href="/register?plan=monthly"
                className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-full font-semibold transition-colors"
              >
                Rozpocznij 7-dniowy trial
              </Link>
            </div>

            {/* Yearly Plan */}
            <div className="bg-primary-500 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white text-primary-500 px-3 py-1 rounded-full text-sm font-semibold">
                2 miesiące gratis
              </div>
              <div className="text-center mb-8">
                <h3 className="text-lg font-semibold text-primary-100 mb-2">
                  Rocznie
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold">499</span>
                  <span className="text-xl text-primary-100">zł/rok</span>
                </div>
                <p className="text-primary-100 text-sm mt-2">
                  ~41,58 zł/mies.
                </p>
              </div>
              <ul className="space-y-4 mb-8">
                <PricingFeature light>
                  Wszystko z planu miesięcznego
                </PricingFeature>
                <PricingFeature light>Priorytetowe wsparcie</PricingFeature>
                <PricingFeature light>Wczesny dostęp do nowości</PricingFeature>
                <PricingFeature light>Oszczędność 89 zł rocznie</PricingFeature>
              </ul>
              <Link
                href="/register?plan=yearly"
                className="block w-full text-center bg-white hover:bg-gray-50 text-primary-500 py-3 rounded-full font-semibold transition-colors"
              >
                Rozpocznij 7-dniowy trial
              </Link>
            </div>
          </div>

          <p className="text-center text-gray-500 mt-8">
            Wszystkie ceny netto. Płatność kartą lub przelewem.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Często zadawane pytania
            </h2>
          </div>

          <div className="space-y-6">
            <FAQItem
              question="Jak działa 7-dniowy trial?"
              answer="Po rejestracji masz pełny dostęp do wszystkich funkcji przez 7 dni. Wymagamy podania karty przy rejestracji, ale nie zostaniesz obciążony do końca okresu próbnego. Możesz anulować w dowolnym momencie."
            />
            <FAQItem
              question="Czy mogę prowadzić wiele zbiórek?"
              answer="Tak! Możesz tworzyć nieograniczoną liczbę zbiórek w ramach jednego konta. Każda zbiórka ma własny cel, zdjęcie i ustawienia."
            />
            <FAQItem
              question="Jak otrzymuję wpłaty?"
              answer="Wpłaty trafiają bezpośrednio na Twoje konto Stripe. My nie pośredniczymy w przepływie pieniędzy - Stripe przekazuje środki na Twoje konto bankowe."
            />
            <FAQItem
              question="Co się stanie jak nie odnowię licencji?"
              answer="Widget będzie nadal widoczny na Twojej stronie, ale przycisk wpłaty zostanie zablokowany. Darczyńcy zobaczą informację, że zbiórka jest chwilowo niedostępna."
            />
            <FAQItem
              question="Czy plugin działa z Framer i WordPress?"
              answer="Tak! Oferujemy osobne wersje dla Framer (wtyczka) i WordPress (plugin). Obie działają z tym samym panelem zarządzania i kontem."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Gotowy, by zbierać więcej wpłat?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Dołącz do fundacji, które już korzystają z Donations Plugin
          </p>
          <Link
            href="/register"
            className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-colors shadow-lg shadow-primary-500/25"
          >
            Rozpocznij 7-dniowy trial →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐾</span>
              <span className="font-bold">Donations Plugin</span>
            </div>
            <div className="flex gap-6 text-gray-600">
              <a href="/privacy" className="hover:text-gray-900">
                Polityka prywatności
              </a>
              <a href="/terms" className="hover:text-gray-900">
                Regulamin
              </a>
              <a href="mailto:hello@donations.pl" className="hover:text-gray-900">
                Kontakt
              </a>
            </div>
            <p className="text-gray-500">
              © {new Date().getFullYear()} Donations Plugin
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function PricingFeature({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <li className="flex items-center gap-3">
      <svg
        className={`w-5 h-5 ${light ? "text-primary-100" : "text-green-500"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span className={light ? "text-white" : "text-gray-700"}>{children}</span>
    </li>
  );
}

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group bg-gray-50 rounded-xl p-6">
      <summary className="flex justify-between items-center cursor-pointer list-none">
        <h3 className="text-lg font-semibold text-gray-900">{question}</h3>
        <svg
          className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>
      <p className="mt-4 text-gray-600">{answer}</p>
    </details>
  );
}
