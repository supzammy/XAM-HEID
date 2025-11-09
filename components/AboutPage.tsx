import React from 'react';

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-brand-surface rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-bold text-brand-teal mb-3">{title}</h3>
        <div className="text-gray-300 space-y-3 text-sm leading-relaxed">
            {children}
        </div>
    </div>
);

const AboutPage: React.FC = () => {
  return (
    <main className="flex-1 p-8 overflow-y-auto bg-brand-bg">
        <div className="max-w-4xl mx-auto">
                <header className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-white mb-2">XAM HEID</h1>
                <p className="text-lg text-gray-400">Uncovering Disparities, Informing Policy</p>
            </header>

            <div className="space-y-8">
                <InfoCard title="Project Mission">
                    <p>
                        The goal of this project is to democratize access to healthcare data. We empower policymakers, researchers, and public health officials to identify, understand, and address health inequities in the United States.
                    </p>
                    <p>
                        By simplifying complex datasets and leveraging AI to highlight significant, often hidden, patterns, this tool aims to drive data-informed decisions that can lead to more equitable health outcomes for all communities.
                    </p>
                </InfoCard>

                <InfoCard title="Data Source & Privacy">
                    <p>
                        This dashboard utilizes a synthetically generated dataset designed to mimic the structure and complexity of real-world healthcare information, such as that from the Healthcare Cost and Utilization Project (HCUP). This approach allows for robust development and demonstration without compromising real patient privacy.
                    </p>
                    <p>
                        A core feature of our methodology is strict adherence to the <strong className="text-white">"Rule of 11"</strong>. To ensure confidentiality, any data point representing fewer than 11 individuals is suppressed and marked as 'Suppressed' on the map. This is a critical privacy-preserving technique used in public health reporting.
                    </p>
                </InfoCard>

                <InfoCard title="Core Features & Methodology">
                   <p>
                        The dashboard quantifies disparities using a <strong className="text-white">Disparity Index</strong>, calculated as the percentage difference between the highest and lowest values in the currently filtered dataset. A higher index indicates greater inequality across states.
                   </p>
                   <p>
                        The <strong className="text-white">AI Policy Advisor</strong> is the heart of the platform, powered by Google's Gemini API. It performs a real-time analysis of the entire dataset for a selected year to uncover non-obvious correlations, provide an instant summary, identify key patterns, and offer an interactive chat to explore the data further.
                   </p>
                   <p>
                        Users can export both a high-fidelity <strong className="text-white">visual report</strong> of the dashboard and a text-based <strong className="text-white">AI Brief</strong> in PDF format, making insights portable and actionable for policy discussions.
                   </p>
                </InfoCard>
                
                <InfoCard title="Technology Stack">
                     <ul className="list-disc list-inside space-y-2">
                        <li><strong className="text-white">Frontend:</strong> Built with React and TypeScript for a robust, modern, and highly interactive user interface.</li>
                        <li><strong className="text-white">AI Integration:</strong> Utilizes the Google Gemini API for real-time data analysis, pattern discovery, and conversational chat.</li>
                        <li><strong className="text-white">Visualization:</strong> Employs Chart.js for dynamic bar charts and react-simple-maps for the interactive choropleth map.</li>
                        <li><strong className="text-white">Styling:</strong> Styled with Tailwind CSS for a responsive, clean, and consistent design system.</li>
                        <li><strong className="text-white">PDF Export:</strong> jsPDF and html2canvas are used to generate high-quality, client-side report exports directly in the browser.</li>
                     </ul>
                </InfoCard>

                <InfoCard title="End-User Journey">
                     <ul className="list-disc list-inside space-y-2">
                        <li>A user selects a health condition, year, and demographic group from the sidebar filter.</li>
                        <li>They instantly view the updated color-coded US map illustrating disparity levels across states.</li>
                        <li>They read the AI-generated summary and discovered patterns in the AI Policy Advisor panel.</li>
                        <li>They use the integrated chat to ask follow-up questions for deeper understanding.</li>
                        <li>They export a report or an AI Brief to share observations with colleagues.</li>
                        <li>Finally, they use these actionable insights to inform policy or prioritize resource allocation toward health equity.</li>
                     </ul>
                </InfoCard>

                 <div className="text-center text-xs text-gray-500 pt-6">
                    <p>This dashboard is a prototype developed for demonstration purposes and uses synthetic data.</p>
                </div>
            </div>
        </div>
    </main>
  );
};

export default AboutPage;