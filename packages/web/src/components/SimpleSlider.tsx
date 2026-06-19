import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
// slick-theme.css ships the icon-font for default arrows/dots; we render our
// own circles + chevron SVGs in index.css, so the woff/ttf is unused.
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  dots?: boolean;
  infinite?: boolean;
  slidestoshow?: number;
  responsiveSlidesToShow?: number;
}

interface ArrowProps {
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  imagePath: string;
}

function PrevArrow({ className, style, onClick, imagePath }: ArrowProps) {
  return (
    <button
      type="button"
      className={`${className ?? ""} cursor-pointer`}
      style={{ ...style, left: "-50px", width: "32px", height: "30px" }}
      onClick={onClick}
    >
      <img src={imagePath} alt="" />
    </button>
  );
}

function NextArrow({ className, style, onClick, imagePath }: ArrowProps) {
  return (
    <button
      type="button"
      className={`${className ?? ""} cursor-pointer`}
      style={{ ...style, right: "-50px", width: "32px", height: "30px" }}
      onClick={onClick}
    >
      <img src={imagePath} alt="" />
    </button>
  );
}

/**
 * Carousel using react-slick. Port of Slider.jsx.
 */
export function SimpleSlider({
  children,
  dots = false,
  infinite = false,
  slidestoshow: slidesToShow = 1,
  responsiveSlidesToShow,
}: Props) {
  const settings = {
    dots,
    nextArrow: <NextArrow imagePath="/images/arrow-right-carousel.svg" />,
    prevArrow: <PrevArrow imagePath="/images/arrow-left-carousel.svg" />,
    infinite,
    speed: 500,
    slidesToShow,
    slidesToScroll: 1,
    initialSlide: 0,
    responsive: [
      {
        breakpoint: 480,
        settings: { slidesToShow: 1, slidesToScroll: 1, infinite },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: responsiveSlidesToShow ?? 2,
          slidesToScroll: 1,
          initialSlide: 0,
          infinite,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: responsiveSlidesToShow ?? 3,
          slidesToScroll: 1,
          infinite,
        },
      },
    ],
  };

  return <Slider {...settings}>{children}</Slider>;
}
