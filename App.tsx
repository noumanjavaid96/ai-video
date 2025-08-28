
import React, { useState, useEffect } from 'react';
import { AssistantPanel } from './components/AssistantPanel';

const VideoFrame = ({ url }: { url: string }) => (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden shadow-2xl">
        <iframe
            src={url}
            className="w-full h-full border-0"
            allow="camera; microphone; fullscreen; speaker; display-capture"
            title="Video Call"
        ></iframe>
    </div>
);

const LoadingScreen = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-xl">{message}</p>
    </div>
);

const ErrorScreen = ({ error }: { error: string }) => (
     <div className="flex flex-col items-center justify-center h-screen bg-red-900/50 text-white p-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-2xl font-bold mb-2">Connection Error</h1>
        <p className="text-center text-red-200">{error}</p>
    </div>
);

const App: React.FC = () => {
    const [roomUrl, setRoomUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRoomUrl = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch("https://api.simli.ai/session/ba8f35e8-ceb6-4692-86ac-b6e07e69b02f/gAAAAABod_M_7EUmplqh6-w1_0rMKto1daae3NAHpEHrAPBNtL8Ne5r_bIIqxGJNfcEG-uu-hDSx0cKb_NbIl1iVjfAhBl31IY4sVM6cRY-rZT118XJAoCleAm5cpsqA3TVRbhxF7JrOVyqMUixvv4BUOK96T1_01R2GGoAlz8nmYRWLa4-J9rVRD007VH9UAwnvkZzINk3MpaIu8vrDnwlE6RA31M-0owj2_EoHbaCszaTAeaPD2zj9M5Au-P5oeywvQzgix5Vea1Z3TDYnsCHV2-AiISk0kWUsQpqmFyNTzRjDP_9FN9q-QRE19dLIvdQbZgqfwLgbRgi5lLb60l4HGO94zqfFMy1R3g9AOe4IIw5AO-MYFasn5DMzXJOWxapYTgKElNBUBsVCkvD0unYCw_s975h7BZdLD6uIS-8rlNcCyPOMWbl789M0hNCU5MNi_P4Qf38ACbejsAF6H4DXSEnMR2KVRq-Ah7D2_iuooncFggOf-1dPlFopop4GrDw5cyrZjanBfZscXkU4VWh5RHot9HzRI0nFi-e5kFNLu8u16RerE675a18-JiPEei8mpvG6sqzlWU_cEdO8WkfK5iGmmwmXTE3FhEh7iaslqCI5-Qsranc2zIv3TFzHQvb738BoxSo8lIyTv2VMWmRl1Tt7m69VgOhVakKi8bvgwDjxFZYeLr9pq_m1LWH3EgHDHcF_ImhQJqi5RJT16cf0Me9FHpv5mg==", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch session data. Status: ${response.status}`);
                }

                const data = await response.json();
                if (data && data.roomUrl) {
                    setRoomUrl(data.roomUrl);
                } else {
                    throw new Error("Invalid data format received from the server.");
                }

            } catch (e: unknown) {
                if (e instanceof Error) {
                    setError(`Could not initialize video session: ${e.message}`);
                } else {
                    setError("An unknown error occurred while initializing the video session.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoomUrl();
    }, []);

    if (isLoading) {
        return <LoadingScreen message="Connecting to video session..." />;
    }

    if (error) {
        return <ErrorScreen error={error} />;
    }

    if (!roomUrl) {
         return <ErrorScreen error="The video room URL could not be loaded." />;
    }

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans">
            <main className="flex-1 p-4">
                <VideoFrame url={roomUrl} />
            </main>
            <aside className="w-full md:w-2/5 lg:w-1/3 h-full border-l border-gray-700">
                <AssistantPanel />
            </aside>
        </div>
    );
};

export default App;
