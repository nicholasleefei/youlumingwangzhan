import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { listBrands } from "@/utils/db";

type Brand = {
  id: string;
  name: string;
  logo_url: string | null;
  is_hot?: boolean;
};

const steps = [
  {
    id: 1,
    icon: "search",
    titleKey: "process.step1.title",
    title: "需求咨询",
    descKey: "process.step1.desc",
    desc: "了解您的需求，推荐合适车型"
  },
  {
    id: 2,
    icon: "document",
    titleKey: "process.step2.title",
    title: "合同签订",
    descKey: "process.step2.desc",
    desc: "确认订单细节，签订采购合同"
  },
  {
    id: 3,
    icon: "factory",
    titleKey: "process.step3.title",
    title: "车辆采购",
    descKey: "process.step3.desc",
    desc: "从厂家采购车辆，质量检验"
  },
  {
    id: 4,
    icon: "customs",
    titleKey: "process.step4.title",
    title: "出口报关",
    descKey: "process.step4.desc",
    desc: "办理出口手续，海关申报"
  },
  {
    id: 5,
    icon: "ship",
    titleKey: "process.step5.title",
    title: "国际物流",
    descKey: "process.step5.desc",
    desc: "海运/陆运运输，全程跟踪"
  }
];

const StepIcon = ({ icon }: { icon: string }) => {
  switch (icon) {
    case "search":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      );
    case "document":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case "factory":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      );
    case "customs":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case "ship":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      );
    default:
      return null;
  }
};

export default function ExportProcess() {
  const { t } = useTranslation();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const brandDotsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    async function fetchBrands() {
      try {
        const data = await listBrands();
        // 过滤出 depth === 1 的品牌
        const brandsList = data.filter(b => b.depth === 1);
        setBrands(brandsList);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }

    fetchBrands();
  }, []);

  useEffect(() => {
    if (brands.length === 0) return;

    const segments = Math.max(1, steps.length);

    let animationFrame: number;
    let startTime: number | null = null;
    const duration = 8000;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;

      brandDotsRef.current.forEach((dot, index) => {
        if (!dot) return;
        const brandIndex = index % brands.length;
        const dotProgress = ((progress - (brandIndex * 0.1)) + 1) % 1;

        const step = Math.floor(dotProgress * segments);
        const stepProgress = (dotProgress * segments) - step;

        const startX = (step / segments) * 100;
        const endX = ((step + 1) / segments) * 100;
        const currentX = startX + (endX - startX) * stepProgress;

        const opacity = Math.max(0.2, Math.sin(dotProgress * Math.PI));
        const scale = 0.8 + Math.sin(dotProgress * Math.PI) * 0.4;

        dot.style.left = `calc(${currentX}% - 20px)`;
        dot.style.opacity = opacity.toString();
        dot.style.transform = `scale(${scale})`;
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [brands]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 relative overflow-hidden">
      <div className="text-center mb-8">
        <h2 className="section-title !font-bold">
          {t("process.title", "How We Work")}
        </h2>
        <p className="section-subtitle">
          {t("process.subtitle", "从中国到全球的专业汽车出口服务流程")}
        </p>
      </div>

      {/* Desktop - Horizontal Timeline with Brand Flow */}
      <div className="hidden lg:block relative">
        <div className="relative">
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-border -translate-y-1/2"></div>


          {/* Brand Logo Flow Animation */}
          <div className="absolute top-28 left-0 right-0 h-0 -translate-y-1/2 z-20">
            {!loading && brands.length > 0 && (() => {
              const displayBrands = brands.slice(0, Math.min(8, brands.length));
              
              return displayBrands.map((brand, index) => (
                <div
                  key={brand.id}
                  ref={(el) => (brandDotsRef.current[index] = el)}
                  className="absolute w-10 h-10 bg-white/90 border border-border rounded-full flex items-center justify-center shadow-glow"
                  style={{
                    left: '0px',
                    opacity: 0,
                    transform: 'scale(0.8)'
                  }}
                >
                  {brand.logo_url ? (
                    <img
                      src={brand.logo_url}
                      alt={brand.name}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        const text = document.createElement('span');
                        text.textContent = brand.name.charAt(0).toUpperCase();
                        text.className = 'text-sm font-semibold text-text-tertiary';
                        img.parentElement?.appendChild(text);
                      }}
                    />
                  ) : (
                    <span className="text-sm font-semibold text-text-tertiary">
                      {brand.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              ));
            })()}
          </div>

          <div className="flex justify-between relative z-10">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-1 flex-col items-center px-2">
                <div className="relative">
                  <div className="w-12 h-12 bg-bg-card border-4 border-accent-green rounded-full flex items-center justify-center text-accent-green shadow-lg hover:scale-110 transition-transform duration-300 z-30 relative backdrop-blur-sm">
                    <StepIcon icon={step.icon} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-green rounded-full flex items-center justify-center text-white text-xs font-bold z-40 shadow-lg" style={{ boxShadow: "var(--glow-green)" }}>
                    {step.id}
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <h3 className="font-bold text-text-primary mb-1 text-lg">
                    {t(step.titleKey, step.title)}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {t(step.descKey, step.desc)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile - Vertical Timeline */}
      <div className="lg:hidden relative">
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-border rounded-full"></div>

        <div className="space-y-8">
          {steps.map((step) => (
            <div key={step.id} className="relative flex items-start gap-4 pl-20">
              <div className="absolute left-6 -translate-x-1/2 z-10">
                <div className="w-12 h-12 bg-bg-card border-4 border-accent-green rounded-full flex items-center justify-center text-accent-green shadow-lg backdrop-blur-sm">
                  <StepIcon icon={step.icon} />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-green rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                  {step.id}
                </div>
              </div>

              <div className="flex-1 glass-card p-4 rounded-lg">
                <h3 className="font-bold text-text-primary mb-1 text-lg">
                  {t(step.titleKey, step.title)}
                </h3>
                <p className="text-sm text-text-secondary">
                  {t(step.descKey, step.desc)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
