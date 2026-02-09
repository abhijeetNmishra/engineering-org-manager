import { Carousel, Typography } from 'antd';
import { useState, useRef } from 'react';
import { WORKSTREAM_HERO_CONTENT, type HeroSlideConfig } from '../config/workstreamHeroConfig';
import type { CarouselRef } from 'antd/es/carousel';
import { useThemeStore } from '../state/themeStore';

const { Title, Text } = Typography;

export function WorkstreamHeroSlider() {
    const [isPaused, setIsPaused] = useState(false);
    const carouselRef = useRef<CarouselRef>(null);
    const theme = useThemeStore((state) => state.theme);
    const isDark = theme === 'dark';

    const handleMouseEnter = () => {
        setIsPaused(true);
    };

    const handleMouseLeave = () => {
        setIsPaused(false);
    };

    return (
        <div
            className="hero-slider-container glass"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                marginBottom: 24,
                borderRadius: 16,
                minHeight: 360,
                overflow: 'hidden',
                position: 'relative',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.06)',
                backdropFilter: 'blur(10px)',
                background: isDark
                    ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)'
                    : 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
                boxShadow: isDark ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.05)'
            }}
        >
            <Carousel
                autoplay={!isPaused}
                autoplaySpeed={5000}
                effect="fade"
                ref={carouselRef}
                dots={{ className: 'hero-dots' }}
            >
                {WORKSTREAM_HERO_CONTENT.map((slide: HeroSlideConfig) => (
                    <div key={slide.id}>
                        <div style={{
                            padding: '48px 40px',
                            minHeight: '320px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            // In light mode, use a very subtle gradient or simple white radial
                            background: isDark
                                ? `radial-gradient(circle at 90% 50%, ${slide.themeGradient.match(/#[0-9a-fA-F]{6}/)?.[0]}15 0%, transparent 60%)`
                                : `radial-gradient(circle at 90% 50%, ${slide.themeGradient.match(/#[0-9a-fA-F]{6}/)?.[0]}10 0%, transparent 60%)`,
                            position: 'relative'
                        }}>
                            {/* Content Side */}
                            <div style={{ maxWidth: '600px', zIndex: 2 }}>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    background: slide.themeGradient,
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '12px',
                                    marginBottom: 16,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                }}>
                                    {slide.icon} WORKSTREAM
                                </div>

                                <Title level={1}
                                    className={isDark ? 'hero-gradient-text-dark' : 'hero-gradient-text-light'}
                                    style={{
                                        margin: '0 0 16px',
                                        fontSize: '42px',
                                        fontWeight: 800,
                                        letterSpacing: '-0.02em',
                                    }}
                                >
                                    {slide.title}
                                </Title>

                                <Text style={{
                                    display: 'block',
                                    fontSize: '20px',
                                    marginBottom: '24px',
                                    color: isDark ? 'rgba(255,255,255,0.9)' : '#4B5563', // Dark gray for light mode
                                    lineHeight: 1.5,
                                    fontWeight: 500
                                }}>
                                    "{slide.vision}"
                                </Text>

                                <div style={{
                                    paddingLeft: 16,
                                    borderLeft: isDark ? '4px solid rgba(255,255,255,0.2)' : '4px solid rgba(0,0,0,0.1)',
                                    opacity: 0.8
                                }}>
                                    <Text style={{
                                        fontSize: '16px',
                                        color: isDark ? 'rgba(255,255,255,0.7)' : '#6B7280'
                                    }}>
                                        {slide.definition}
                                    </Text>
                                </div>
                            </div>

                            {/* Visual Side (Abstract/Icon) */}
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                fontSize: '120px',
                                opacity: isDark ? 0.8 : 0.6,
                                filter: 'drop-shadow(0 0 40px rgba(0,0,0,0.3))',
                                transform: 'scale(1.2) rotate(-10deg)',
                                userSelect: 'none',
                                // In light mode, grayscale icons might look better or just reduced opacity
                            }}>
                                {slide.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </Carousel>
        </div>
    );
}
