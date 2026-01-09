function plotoutput(out, summary)
t = out.t;

figure;

yyaxis left
plot(t, out.Pc/1e6);
ylabel('Chamber Pressure (MPa)');
ylim([0, 1.05*max(out.Pc/1e6)]);

yyaxis right
plot(t, out.F);
ylabel('Thrust (N)');
ylim([0, 1.05*max(out.F)]);   % forces nonnegative axis

xlabel('Time (s)');
grid on;

title(sprintf('%s | Itot=%.0f N·s | tb=%.2f s | Isp(del)=%.1f s', ...
    summary.designation, summary.Itot, summary.burnTime, summary.Isp_delivered));
end
