import React, { useState, useEffect } from 'react';
import { Helmet } from "react-helmet-async";
import type { View, Event } from '../types';
import { EVENTS_DATA } from '../constants';
import { useOnScreen } from '../hooks/useOnScreen';
import { useCountdown } from '../hooks/useCountdown';

interface EventsPageProps {
    setView: (view: View) => void;
}

const AnimatedContainer: React.FC<{ children: React.ReactNode, delay?: number, className?: string }> = ({ children, delay = 0, className = '' }) => {
    const [ref, isVisible] = useOnScreen<HTMLDivElement>({ threshold: 0.1 });

    return (
        <div
            ref={ref}
            className={`opacity-0 ${isVisible ? 'animate-fadeInUp' : ''} ${className}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

const CountdownTimer: React.FC<{ targetDate: string }> = ({ targetDate }) => {
    const { days, hours, minutes, seconds } = useCountdown(targetDate);
    const timeParts = [
        { label: 'Days', value: days },
        { label: 'Hours', value: hours },
        { label: 'Mins', value: minutes },
        { label: 'Secs', value: seconds },
    ];
    return (
        <div className="flex items-center gap-2 sm:gap-4 text-center">
            {timeParts.map(part => (
                <div key={part.label} className="flex flex-col items-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg text-white text-2xl sm:text-3xl font-bold">
                        {String(part.value).padStart(2, '0')}
                    </div>
                    <span className="text-xs sm:text-sm mt-1 text-slate-300 font-semibold">{part.label}</span>
                </div>
            ))}
        </div>
    );
};

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
    const categoryColors: { [key in Event['category']]: string } = {
        'Webinar': 'bg-[--primary-medium]/10 text-[--primary-dark]',
        'Workshop': 'bg-orange-100 text-orange-800',
        'College Fair': 'bg-green-100 text-green-800',
        'Deadline': 'bg-red-100 text-red-800',
    };

    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group border flex flex-col md:flex-row">
            <div className="md:w-2/5 relative">
                <img src={event.imageUrl} alt={event.title} className="w-full h-56 md:h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4 flex flex-col justify-end">
                    <CountdownTimer targetDate={event.date} />
                </div>
            </div>
            <div className="md:w-3/5 p-6 flex flex-col">
                <div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${categoryColors[event.category]}`}>{event.category}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 leading-tight mt-3">{event.title}</h3>
                <p className="text-sm font-semibold text-slate-500 mt-1">{formattedDate}</p>
                <p className="text-slate-600 mt-4 text-base flex-grow">{event.description}</p>
                <div className="mt-6">
                    <a
                        href={event.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-3 font-semibold text-white bg-[--accent-green] rounded-lg shadow-md hover:bg-green-700 transition-all duration-300"
                    >
                        Register Now
                    </a>
                </div>
            </div>
        </div>
    );
};


const EventsPage: React.FC<EventsPageProps> = ({ setView }) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch("https://studycupsbackend-wb8p.onrender.com/api/events");
                const json = await res.json();
                if (json.success) setEvents(json.data);
                setLoading(false);
            } catch (err) {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    return (
        <div className="bg-[#f8fafc]">
            <Helmet>
                <title>Educational Events &amp; Webinars 2026 – College Fairs, Workshops | StudyCups</title>
                <meta name="description" content="Discover upcoming educational events 2026 – college fairs, webinars, workshops and admission deadlines. Register for free counselling sessions and MBA, B.Tech, MBBS guidance events." />
                <meta name="keywords" content="educational events 2026, college fair India, MBA webinar, admission workshop, StudyCups events, college counselling event, JEE workshop, NEET seminar" />
                <link rel="canonical" href="https://studycups.in/events" />
                <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="StudyCups" />
                <meta property="og:title" content="Educational Events & Webinars 2026 | StudyCups" />
                <meta property="og:description" content="Upcoming college fairs, webinars, workshops and admission deadlines. Free counselling sessions for MBA, B.Tech, MBBS 2026 admissions." />
                <meta property="og:url" content="https://studycups.in/events" />
                <meta property="og:image" content="https://studycups.in/logos/StudyCups.png" />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:locale" content="en_IN" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Educational Events & Webinars 2026 | StudyCups" />
                <meta name="twitter:description" content="Upcoming college fairs, webinars, workshops and admission deadlines for 2026 admissions." />
                <meta name="twitter:image" content="https://studycups.in/logos/StudyCups.png" />
                <script type="application/ld+json">{JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {"@type":"ListItem","position":1,"name":"Home","item":"https://studycups.in"},
                        {"@type":"ListItem","position":2,"name":"Events 2026","item":"https://studycups.in/events"}
                    ]
                })}</script>
            </Helmet>

            {/* Hero Section */}
            <section className="relative md:mt-[100px] mt-0 overflow-hidden">
                {/* 4-layer gradient bg */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#030c1a] via-[#061528] to-[#0b2545]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(14,165,233,0.18)_0%,transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.14)_0%,transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)]" />

                {/* 3 glow orbs */}
                <div className="pointer-events-none absolute top-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full bg-indigo-600/20 blur-[80px]" />
                <div className="pointer-events-none absolute bottom-[-40px] right-[10%] w-[250px] h-[250px] rounded-full bg-sky-500/15 blur-[70px]" />
                <div className="pointer-events-none absolute top-[30%] right-[-40px] w-[200px] h-[200px] rounded-full bg-amber-400/10 blur-[60px]" />

                {/* dot-grid overlay */}
                <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:"radial-gradient(circle,#fff 1px,transparent 1px)",backgroundSize:"28px 28px"}} />

                <div className="relative max-w-7xl mx-auto px-4 py-5 md:py-8 text-center">
                    {/* breadcrumb */}
                    <nav aria-label="breadcrumb" className="mb-3 flex items-center justify-center gap-1.5 text-[11px] text-white/50">
                        <a href="/" className="hover:text-white transition">Home</a>
                        <span>/</span>
                        <span className="text-amber-400 font-medium">Events 2026</span>
                    </nav>

                    {/* animated badge */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-0.5 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                            LIVE EVENTS · WEBINARS · COLLEGE FAIRS · WORKSHOPS
                        </span>
                    </div>

                    <h1 className="text-[22px] sm:text-[30px] md:text-[38px] font-extrabold leading-tight text-white mb-3">
                        Upcoming{" "}
                        <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                            Educational Events
                        </span>
                    </h1>

                    <p className="text-white/65 text-[12px] md:text-[14px] leading-relaxed max-w-2xl mx-auto mb-4">
                        Stay ahead with <strong className="text-white/90">webinars, workshops, college fairs</strong> and important admission deadlines. Register for free counselling sessions for MBA, B.Tech &amp; MBBS 2026 admissions.
                    </p>

                    {/* 4 inline stats */}
                    <div className="flex flex-wrap gap-4 mt-2 text-white/80 text-[11px] justify-center">
                        <span>🎓 <strong className="text-white">Free</strong> Webinars</span>
                        <span>🏛️ <strong className="text-white">College</strong> Fairs</span>
                        <span>📅 <strong className="text-white">Live</strong> Deadlines</span>
                        <span>💬 <strong className="text-white">Expert</strong> Sessions</span>
                    </div>
                </div>

                {/* Wave SVG divider */}
                <div className="relative w-full overflow-hidden leading-[0] h-6">
                    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full" fill="#f8fafc">
                        <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"/>
                    </svg>
                </div>
            </section>

            {/* Events Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                {loading ? (
                    <p className="text-center py-20 text-lg">Loading events...</p>
                ) : events.length > 0 ? (
                    <div className="space-y-12">
                        {events.map((event, index) => (
                            <AnimatedContainer key={event.id} delay={index * 100}>
                                <EventCard event={event} />
                            </AnimatedContainer>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <div className="text-4xl mb-4">📅</div>
                        <h3 className="text-[20px] font-bold text-slate-800">No Upcoming Events</h3>
                        <p className="text-slate-500 mt-2 text-sm">New events are being planned. Check back soon!</p>
                        <a href="/" className="inline-block mt-6 px-6 py-2.5 bg-gradient-to-r from-[#1f4fa8] to-[#0a214a] text-white rounded-xl text-sm font-semibold">
                            Back to Home
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventsPage;
