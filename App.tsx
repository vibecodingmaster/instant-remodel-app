/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateStyleImage } from './services/geminiService';
import PolaroidCard from './components/PolaroidCard';
import { createAlbumPage } from './lib/albumUtils';
import Footer from './components/Footer';

const STYLES = ['Modern', 'Scandinavian', 'Industrial', 'Bohemian', 'Farmhouse', 'Minimalist'];

// Pre-defined positions for a scattered look on desktop
const POSITIONS = [
    { top: '5%', left: '10%', rotate: -8 },
    { top: '15%', left: '60%', rotate: 5 },
    { top: '45%', left: '5%', rotate: 3 },
    { top: '2%', left: '35%', rotate: 10 },
    { top: '40%', left: '70%', rotate: -12 },
    { top: '50%', left: '38%', rotate: -3 },
];

type ImageStatus = 'pending' | 'done' | 'error';
interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    error?: string;
}

const primaryButtonClasses = "font-permanent-marker text-xl text-center text-black bg-yellow-400 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:-rotate-2 hover:bg-yellow-300 shadow-[2px_2px_0px_2px_rgba(0,0,0,0.2)]";
const secondaryButtonClasses = "font-permanent-marker text-xl text-center text-white bg-white/10 backdrop-blur-sm border-2 border-white/80 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:rotate-2 hover:bg-white hover:text-black";

const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);
    return matches;
};

function App() {
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [appState, setAppState] = useState<'idle' | 'image-uploaded' | 'generating' | 'results-shown'>('idle');
    const dragAreaRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');


    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const readerPromises = files.map(file => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(readerPromises).then(results => {
                setUploadedImages(prev => [...prev, ...results]);
                setAppState('image-uploaded');
                setGeneratedImages({});
            }).catch(error => {
                console.error("Error reading files:", error);
                alert("Sorry, there was an error uploading your images. Please try again.");
            });
             // Reset the input value to allow re-uploading the same file(s)
            e.target.value = '';
        }
    };

    const handleGenerateClick = async () => {
        if (uploadedImages.length === 0) return;

        setIsLoading(true);
        setAppState('generating');
        
        const initialImages: Record<string, GeneratedImage> = {};
        STYLES.forEach(style => {
            initialImages[style] = { status: 'pending' };
        });
        setGeneratedImages(initialImages);

        const concurrencyLimit = 2; // Process two styles at a time
        const stylesQueue = [...STYLES];

        const processStyle = async (style: string) => {
            try {
                const prompt = `Using the provided image(s) of a room or home exterior, generate a photorealistic remodeled version in a ${style} design style. The new design should be a plausible renovation of the original space, keeping the core structure (windows, doors) in the same location but changing walls, floors, furniture, lighting, and decor to fit the new aesthetic. The output must be a high-quality, photorealistic image.`;
                const resultUrl = await generateStyleImage(uploadedImages, prompt);
                setGeneratedImages(prev => ({
                    ...prev,
                    [style]: { status: 'done', url: resultUrl },
                }));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setGeneratedImages(prev => ({
                    ...prev,
                    [style]: { status: 'error', error: errorMessage },
                }));
                console.error(`Failed to generate image for ${style}:`, err);
            }
        };

        const workers = Array(concurrencyLimit).fill(null).map(async () => {
            while (stylesQueue.length > 0) {
                const style = stylesQueue.shift();
                if (style) {
                    await processStyle(style);
                }
            }
        });

        await Promise.all(workers);

        setIsLoading(false);
        setAppState('results-shown');
    };

    const handleRegenerateStyle = async (style: string) => {
        if (uploadedImages.length === 0) return;

        if (generatedImages[style]?.status === 'pending') {
            return;
        }
        
        console.log(`Regenerating image for ${style}...`);

        setGeneratedImages(prev => ({
            ...prev,
            [style]: { status: 'pending' },
        }));

        try {
            const prompt = `Using the provided image(s) of a room or home exterior, generate a photorealistic remodeled version in a ${style} design style. The new design should be a plausible renovation of the original space, keeping the core structure (windows, doors) in the same location but changing walls, floors, furniture, lighting, and decor to fit the new aesthetic. The output must be a high-quality, photorealistic image.`;
            const resultUrl = await generateStyleImage(uploadedImages, prompt);
            setGeneratedImages(prev => ({
                ...prev,
                [style]: { status: 'done', url: resultUrl },
            }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setGeneratedImages(prev => ({
                ...prev,
                [style]: { status: 'error', error: errorMessage },
            }));
            console.error(`Failed to regenerate image for ${style}:`, err);
        }
    };
    
    const handleReset = () => {
        setUploadedImages([]);
        setGeneratedImages({});
        setAppState('idle');
    };

    const handleDownloadIndividualImage = (style: string) => {
        const image = generatedImages[style];
        if (image?.status === 'done' && image.url) {
            const link = document.createElement('a');
            link.href = image.url;
            link.download = `instant-remodel-${style}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleDownloadAlbum = async () => {
        setIsDownloading(true);
        try {
            const imageData = Object.entries(generatedImages)
                .filter(([, image]) => image.status === 'done' && image.url)
                .reduce((acc, [style, image]) => {
                    acc[style] = image!.url!;
                    return acc;
                }, {} as Record<string, string>);

            if (Object.keys(imageData).length === 0) {
                alert("No images have been generated yet.");
                return;
            }

            const albumDataUrl = await createAlbumPage(imageData);

            const link = document.createElement('a');
            link.href = albumDataUrl;
            link.download = 'instant-remodel-album.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Failed to create or download album:", error);
            alert("Sorry, there was an error creating your album. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <main className="bg-black text-neutral-200 min-h-screen w-full flex flex-col items-center justify-center p-4 pb-24 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05]"></div>
            
            <div className="z-10 flex flex-col items-center justify-center w-full h-full flex-1 min-h-0">
                <div className="text-center mb-10">
                    <h1 className="text-5xl md:text-7xl font-caveat font-bold text-neutral-100">Instant Remodel by Ana Maria Zuluaga</h1>
                    <p className="font-permanent-marker text-neutral-300 mt-2 text-xl tracking-wide">Visualize your dream home or landscaping with precise renderings</p>
                </div>

                {appState === 'idle' && (
                     <div className="relative flex flex-col items-center justify-center w-full">
                        <motion.div
                             initial={{ opacity: 0, scale: 0.8, y: 50 }}
                             animate={{ opacity: 1, scale: 1, y: 0 }}
                             transition={{ delay: 0.2, duration: 0.8, type: 'spring' }}
                             className="flex flex-col items-center"
                        >
                            <label htmlFor="file-upload" className="cursor-pointer group transform hover:scale-105 transition-transform duration-300">
                                 <PolaroidCard 
                                     caption="Upload Your Space"
                                     status="done"
                                 />
                            </label>
                            <input id="file-upload" type="file" multiple className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
                            <p className="mt-8 font-permanent-marker text-neutral-500 text-center max-w-xs text-lg">
                                Upload one or more photos of your space to get started.
                            </p>
                        </motion.div>
                    </div>
                )}

                {appState === 'image-uploaded' && uploadedImages.length > 0 && (
                    <motion.div 
                        className="flex flex-col items-center gap-6 w-full"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                         <div className="flex items-center justify-center w-full max-w-2xl">
                            <div className="flex gap-4 p-4 overflow-x-auto w-full snap-x">
                                {uploadedImages.map((image, index) => (
                                    <img key={index} src={image} alt={`Uploaded photo ${index + 1}`} className="h-40 md:h-52 rounded-md object-cover border-4 border-neutral-700 snap-center shadow-lg"/>
                                ))}
                            </div>
                         </div>
                         <div className="flex items-center gap-4 mt-4">
                            <button onClick={handleReset} className={secondaryButtonClasses}>
                                Clear Photos
                            </button>
                            <button onClick={handleGenerateClick} className={primaryButtonClasses}>
                                Generate Ideas
                            </button>
                         </div>
                    </motion.div>
                )}

                {(appState === 'generating' || appState === 'results-shown') && (
                     <>
                        {isMobile ? (
                            <div className="w-full max-w-sm flex-1 overflow-y-auto mt-4 space-y-8 p-4">
                                {STYLES.map((style) => (
                                    <div key={style} className="flex justify-center">
                                         <PolaroidCard
                                            caption={style}
                                            status={generatedImages[style]?.status || 'pending'}
                                            imageUrl={generatedImages[style]?.url}
                                            error={generatedImages[style]?.error}
                                            onShake={handleRegenerateStyle}
                                            onDownload={handleDownloadIndividualImage}
                                            isMobile={isMobile}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div ref={dragAreaRef} className="relative w-full max-w-5xl h-[600px] mt-4">
                                {STYLES.map((style, index) => {
                                    const { top, left, rotate } = POSITIONS[index];
                                    return (
                                        <motion.div
                                            key={style}
                                            className="absolute cursor-grab active:cursor-grabbing"
                                            style={{ top, left }}
                                            initial={{ opacity: 0, scale: 0.5, y: 100, rotate: 0 }}
                                            animate={{ 
                                                opacity: 1, 
                                                scale: 1, 
                                                y: 0,
                                                rotate: `${rotate}deg`,
                                            }}
                                            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.15 }}
                                        >
                                            <PolaroidCard 
                                                dragConstraintsRef={dragAreaRef}
                                                caption={style}
                                                status={generatedImages[style]?.status || 'pending'}
                                                imageUrl={generatedImages[style]?.url}
                                                error={generatedImages[style]?.error}
                                                onShake={handleRegenerateStyle}
                                                onDownload={handleDownloadIndividualImage}
                                                isMobile={isMobile}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                         <div className="h-20 mt-4 flex items-center justify-center">
                            {appState === 'results-shown' && (
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <button 
                                        onClick={handleDownloadAlbum} 
                                        disabled={isDownloading} 
                                        className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isDownloading ? 'Creating Album...' : 'Download Album'}
                                    </button>
                                    <button onClick={handleReset} className={secondaryButtonClasses}>
                                        Start Over
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            <Footer />
        </main>
    );
}

export default App;