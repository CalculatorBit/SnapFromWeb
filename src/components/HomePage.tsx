import type { FC } from 'hono/jsx'

export const HomePage: FC = () => {
  return (
    <html>
      <head>
        <title>SnapFromWeb - Website Screenshot Tool</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{__html: `
          document.addEventListener('DOMContentLoaded', () => {
            const form = document.querySelector('form');
            const input = document.querySelector('input[name="url"]');
            const submitBtn = document.querySelector('button[type="submit"]');
            const resultDiv = document.querySelector('#result');

            let originalBtnText = submitBtn.textContent;
            let currentImageUrl = null;
            let checkingImage = false;

            // Function to check if image exists and is loaded
            const checkImage = (url) => {
              return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = url;
              });
            };

            // Function to show loading state
            const showLoading = (message = 'Processing...') => {
              submitBtn.disabled = true;
              submitBtn.innerHTML = \`<span class="inline-flex items-center"><svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>\${message}</span>\`;
            };

            // Function to restore button state
            const restoreButton = () => {
              submitBtn.disabled = false;
              submitBtn.textContent = originalBtnText;
            };

            // Function to show the screenshot result
            const showScreenshot = (imageUrl) => {
              resultDiv.innerHTML = \`
                <div class="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div class="flex justify-between items-center mb-2">
                    <h3 class="text-green-800 font-medium">Screenshot captured successfully!</h3>
                    <button type="button" onclick="window.checkScreenshotAgain()" class="text-sm bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-md transition-colors">
                      Refresh
                    </button>
                  </div>
                  <div class="relative">
                    <img src="\${imageUrl}?t=\${Date.now()}" alt="Screenshot" class="rounded-lg shadow-sm w-full" />
                    <a href="\${imageUrl}" download class="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-md text-sm font-medium shadow-sm hover:shadow transition-all duration-200">
                      Download
                    </a>
                  </div>
                </div>
              \`;
            };

            // Function to show waiting state
            const showWaiting = (imageUrl) => {
              resultDiv.innerHTML = \`
                <div class="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div class="flex justify-between items-center">
                    <div class="flex items-center">
                      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span class="text-yellow-800">Waiting for screenshot to be processed...</span>
                    </div>
                    <button type="button" onclick="window.checkScreenshotAgain()" class="text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded-md transition-colors">
                      Check Again
                    </button>
                  </div>
                </div>
              \`;
            };

            // Function to check screenshot availability
            const checkScreenshotAvailability = async (imageUrl, retries = 10, interval = 2000) => {
              if (checkingImage) return;
              checkingImage = true;
              currentImageUrl = imageUrl;

              for (let i = 0; i < retries; i++) {
                const exists = await checkImage(imageUrl + '?t=' + Date.now());
                if (exists) {
                  showScreenshot(imageUrl);
                  checkingImage = false;
                  return true;
                }
                if (i < retries - 1) {
                  showWaiting(imageUrl);
                  await new Promise(resolve => setTimeout(resolve, interval));
                }
              }

              checkingImage = false;
              return false;
            };

            // Expose check function globally for the refresh button
            window.checkScreenshotAgain = async () => {
              if (currentImageUrl) {
                showWaiting(currentImageUrl);
                await checkScreenshotAvailability(currentImageUrl);
              }
            };

            form.addEventListener('submit', async (e) => {
              e.preventDefault();

              // Reset states
              resultDiv.innerHTML = '';
              showLoading();

              try {
                const url = input.value;
                const response = await fetch('/screenshot?url=' + encodeURIComponent(url));
                const data = await response.json();

                if (response.ok) {
                  // Start checking for screenshot availability
                  showWaiting(data.url);
                  const imageAvailable = await checkScreenshotAvailability(data.url);

                  if (!imageAvailable) {
                    resultDiv.innerHTML = \`
                      <div class="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div class="flex justify-between items-center">
                          <p class="text-yellow-800">Screenshot is taking longer than expected...</p>
                          <button type="button" onclick="window.checkScreenshotAgain()" class="text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded-md transition-colors">
                            Try Again
                          </button>
                        </div>
                      </div>
                    \`;
                  }
                } else {
                  throw new Error(data.error || 'Failed to capture screenshot');
                }
              } catch (error) {
                resultDiv.innerHTML = \`
                  <div class="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div class="text-red-800">
                      <p class="font-medium">Error capturing screenshot</p>
                      <p class="text-sm mt-1">\${error.message}</p>
                    </div>
                  </div>
                \`;
              } finally {
                restoreButton();
              }
            });

            // Add URL validation
            input.addEventListener('input', (e) => {
              const url = e.target.value;
              try {
                new URL(url);
                input.setCustomValidity('');
              } catch {
                input.setCustomValidity('Please enter a valid URL (e.g., https://example.com)');
              }
            });
          });
        `}} />
      </head>
      <body className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen font-[Inter]">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">SnapFromWeb</h1>
            <p className="text-lg text-gray-600 mb-8">Capture website screenshots instantly and effortlessly</p>
          </header>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <form className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                  Enter Website URL
                </label>
                <div className="flex gap-3">
                  <input
                    id="url"
                    name="url"
                    type="url"
                    placeholder="https://example.com"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    Take Screenshot
                  </button>
                </div>
              </div>
            </form>

            {/* Result container */}
            <div id="result"></div>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Features</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>High-quality full page screenshots</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Fast and reliable capture</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Batch screenshot support</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Automatic image storage</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}