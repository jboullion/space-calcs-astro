import { SRMProvider } from './SRMContext';
import SRMForm from './SRMForm';
import SRMResults from './SRMResults';
import SRMVisualization from './SRMVisualization';
import SRMCharts from './SRMCharts';

export default function SRMSimulator() {
	return (
		<SRMProvider>
			<div id="srm-simulator__app" className="row calculator">
				{/* Left Panel: Form Inputs */}
				<div id="srm-simulator__form" className="col-lg-5">
					<SRMForm />
				</div>

				{/* Right Panel: Visualization & Results */}
				<div id="srm-simulator__results" className="col-lg-7">
					{/* <SRMVisualization />				 */}
                    <SRMCharts />					
                    <SRMResults />
				</div>
			</div>
		</SRMProvider>
	);
}
