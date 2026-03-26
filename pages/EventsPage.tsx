import React, { useState, useEffect } from 'react';
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
                const res = await fetch("http://localhost:5000/api/events");
                const json = await res.json();
                if (json.success) setEvents(json.data);
                setLoading(false);
            } catch {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);
    return (
        <div className="bg-slate-50">
            {/* Hero Section */}
            <section className="bg-[--primary-dark] text-white py-20 rounded-b-3xl">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Upcoming Educational Events</h1>
                    <p className="mt-4 text-lg text-white/80 max-w-3xl mx-auto">
                        Stay informed about webinars, workshops, college fairs, and important deadlines. Don't miss out on opportunities to advance your academic journey.
                    </p>
                </div>
            </section>

            {/* Events Grid */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
                    <div className="text-center py-20 bg-white rounded-lg shadow-sm border">
                        <h3 className="text-2xl font-semibold text-slate-700">No Upcoming Events</h3>
                        <p className="text-slate-500 mt-2">Please check back later.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventsPage;
