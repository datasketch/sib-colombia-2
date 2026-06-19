import type { Slide } from "../api/types";
import { WaffleChart } from "./charts/WaffleChart";
import { formatNumber } from "../lib/format";

interface Props {
  slides: Slide[];
}

export function Slides({ slides }: Props) {
  if (!slides || slides.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="font-barlow-condensed text-3xl text-dartmouth-green mb-6">
        En cifras
      </h2>
      <div className="space-y-8">
        {slides.map((slide) => (
          <SlideRenderer key={slide.id} slide={slide} />
        ))}
      </div>
    </section>
  );
}

function SlideRenderer({ slide }: { slide: Slide }) {
  switch (slide.layout) {
    case "title/(text|chart)":
      return <TitleTextChart slide={slide} />;
    case "text-blocks":
      return <TextBlocks slide={slide} />;
    case "title/(chart|chart)":
      return <TitleChartChart slide={slide} />;
    default:
      return null;
  }
}

function MarkdownLite({ text }: { text: string }) {
  // Convert simple _italic_ markdown to <em>
  const parts = text.split(/(_[^_]+_)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("_") && part.endsWith("_")
          ? <em key={i}>{part.slice(1, -1)}</em>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

function TitleTextChart({ slide }: { slide: Slide }) {
  const waffle = slide.waffle as { slug_region: string; especies_region_total: number }[] | undefined;
  return (
    <div className="bg-white rounded-lg shadow-default p-6">
      {slide.title && (
        <h3 className="font-barlow-condensed text-2xl text-dartmouth-green mb-4">
          {slide.title}
        </h3>
      )}
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <p className="text-gray-700">
          <MarkdownLite text={slide.description ?? ""} />
        </p>
        {waffle && waffle.length >= 2 && (
          <div className="flex justify-center">
            <WaffleChart data={waffle} />
          </div>
        )}
      </div>
    </div>
  );
}

function TextBlocks({ slide }: { slide: Slide }) {
  const texts = slide.texts ?? [];
  return (
    <div className="bg-white rounded-lg shadow-default p-6 space-y-4">
      {texts.map((text, i) => (
        <p key={i} className="text-gray-700">
          <MarkdownLite text={text} />
        </p>
      ))}
    </div>
  );
}

function TitleChartChart({ slide }: { slide: Slide }) {
  const endemicas = slide.n_muni_mas_endemicas as { label: string; n: number }[] | undefined;
  const amenazadas = slide.n_muni_mas_amenazadas_nacional as { label: string; n: number }[] | undefined;

  return (
    <div className="bg-white rounded-lg shadow-default p-6">
      {slide.title && (
        <h3 className="font-barlow-condensed text-2xl text-dartmouth-green mb-4">
          {slide.title}
        </h3>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        {endemicas && <RankList title="Más endémicas" items={endemicas} />}
        {amenazadas && <RankList title="Más amenazadas" items={amenazadas} />}
      </div>
    </div>
  );
}

function RankList({ title, items }: { title: string; items: { label: string; n: number }[] }) {
  const max = Math.max(...items.map((i) => i.n), 1);
  return (
    <div>
      <h4 className="font-semibold text-sm text-gray-700 mb-2">{title}</h4>
      <ol className="space-y-1 text-sm">
        {items.slice(0, 10).map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-8 text-right text-gray-500">{i + 1}.</span>
            <span className="flex-1">{item.label}</span>
            <span className="font-semibold w-12 text-right">{formatNumber(item.n)}</span>
            <div className="bg-gray-100 h-2 w-20 rounded">
              <div className="bg-lemon h-2 rounded" style={{ width: `${(item.n / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
