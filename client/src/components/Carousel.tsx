import React from 'react';
import { Box } from '@mui/material';
import Slider, { Settings } from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

export const DEFAULT_SETTINGS: Settings = {
  dots: true,
  arrows: false,
  infinite: false, // true,
  speed: 300,
  slidesToShow: 1,
  slidesToScroll: 1,
  // autoplay: true,
  // autoplaySpeed: 2000
  // nextArrow: <SampleNextArrow />,
  // prevArrow: <SamplePrevArrow />,
  appendDots: (dots) => (
    <Box
      sx={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'primary',
        p: 0,
        zIndex: 10,
      }}
    >
      {dots}
    </Box>
  ), // default:  dots => <ul>{dots}</ul>
  customPaging: (i) => (
    // <Box
    //   // component='li'
    //   sx={{
    //     width: '18px',
    //     height: '18px',
    //     opacity: 0.32,
    //     display: 'flex',
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //     cursor: 'pointer',
    //   }}
    // >
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        right: '16px',
        bottom: '16px',
        position: 'absolute',
      }}
    >
      <Box
        component='span'
        sx={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          transition: 'width 250ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
          backgroundColor: 'red',
          // backgroundColor: 'currentcolor',
        }}
      />
    </Box>
    // </Box>
  ),
  // customPaging: (i) => (
  //   <div
  //     style={{
  //       width: '30px',
  //       color: 'blue',
  //       border: '1px blue solid',
  //     }}
  //   >
  //     {i + 1}
  //   </div>
  // ),
};

export interface CarouselProps {
  sliderSettings?: Settings;
  items: React.ReactElement[]; // renderItems ?
}

export const Carousel: React.FC<CarouselProps> = ({ sliderSettings = {}, items }) => {
  return (
    <Box sx={{ '& div .slick-list': { borderRadius: 2 } }}>
      <Slider {...DEFAULT_SETTINGS} {...sliderSettings}>
        {items.map((item, i) => (
          <div key={`carousel-${i}`}>{item}</div>
        ))}
      </Slider>
    </Box>
  );
};
