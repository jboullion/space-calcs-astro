function plotoutput(out, summary)
t = out.t(:);

% --- Compute Kn = Ab / At ---
At = NaN;
if isfield(summary,'noz') && isfield(summary.noz,'At')
    At = summary.noz.At;
elseif isfield(summary,'At')
    At = summary.At;
end

if ~isfinite(At) || At <= 0
    warning('plotoutput:MissingAt','Could not find At in summary; Kn will be NaN.');
    Kn = nan(size(t));
else
    Kn = out.Ab(:) ./ At;
end

% --- Units ---
Pc_psi = out.Pc(:) / 6894.757;
F_N    = out.F(:);

% --- Choose constant scale factors (NOT normalized-to-peak) ---
% Tune these two numbers to taste.
PcScale = 10;   % plot Pc_psi / 10 (so 3000 psi -> 300 on plot)
FScale  = 1;    % plot F_N / 1 (no scaling)

Pc_plot = Pc_psi / PcScale;
F_plot  = F_N    / FScale;

% --- Plot style (dark) ---
figure;
ax = gca;
grid(ax,'on'); box(ax,'on'); hold(ax,'on');

% Lines
pKn = plot(ax, t, Kn,      'LineWidth', 2.2, 'DisplayName', 'Kn');
pPc = plot(ax, t, Pc_plot, 'LineWidth', 2.2, ...
    'DisplayName', sprintf('Chamber Pressure - psi / %g', PcScale));
pF  = plot(ax, t, F_plot,  'LineWidth', 2.2, ...
    'DisplayName', sprintf('Thrust - N / %g', FScale));

xlabel(ax, 'Time - s');
ylabel(ax, 'Plot units (see legend)');

title(ax, sprintf('%s | Itot=%.0f N·s | tb=%.2f s | Isp(del)=%.1f s', ...
    summary.designation, summary.Itot, summary.burnTime, summary.Isp_delivered));

leg = legend(ax, [pKn pPc pF], 'Location','northwest');

% Optional: keep y-limits sane (prevents negative blowdown from dominating)
ymin = min([Kn; Pc_plot; F_plot], [], 'omitnan');
ymax = max([Kn; Pc_plot; F_plot], [], 'omitnan');
ylim(ax, [min(0, ymin), 1.05*ymax]);

end
