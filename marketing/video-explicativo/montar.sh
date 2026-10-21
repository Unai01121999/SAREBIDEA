#!/bin/sh
# Monta el vídeo: fondo con brillos que se mueven + grabación del móvil (recortada del vídeo original) + marco + textos por escena.
# Uso: sh montar.sh VIDEO_ORIGINAL.mp4 CARPETA_CAPAS SALIDA.mp4
V="$1"; C="$2"; OUT="$3"
T="0 7.75 16.75 22.5 30.75 40.5 46.5 52.1"; F=0.35
set -- $T; i=0; CAPS=""; CHAIN="[base]"; INPUTS=""
while [ $# -gt 1 ]; do
  a=$1; b=$2; shift
  INPUTS="$INPUTS -loop 1 -framerate 30 -t 52.1 -i $C/c$i.png"
  # Fundido cruzado: el texto nuevo entra mientras sale el anterior (en los F segundos previos al cambio).
  ini=$(awk "BEGIN{print ($i==0)?0:$a-$F}"); fout=$(awk "BEGIN{print ($b>=52.1)?99:$b-$F}")
  CAPS="$CAPS[$((i+6)):v]format=rgba,fade=t=in:st=$ini:d=$F:alpha=1,fade=t=out:st=$fout:d=$F:alpha=1[t$i];"
  CHAIN="$CHAIN[t$i]overlay=0:0:shortest=1:enable='between(t,$ini,$b)'"
  [ $i -lt 6 ] && CHAIN="$CHAIN[o$i];[o$i]"
  i=$((i+1))
done
ffmpeg -v error -y -i "$V" -loop 1 -framerate 30 -i $C/bg.png -loop 1 -framerate 30 -i $C/g1.png -loop 1 -framerate 30 -i $C/g2.png -loop 1 -framerate 30 -i $C/frame.png -loop 1 -framerate 30 -i $C/mask.png $INPUTS -filter_complex "
[1:v]format=rgba,trim=duration=52.1[bg];
[2:v]format=rgba[g1];[3:v]format=rgba[g2];
[bg][g1]overlay=x='-80+140*sin(2*PI*t/19)':y='-560+120*cos(2*PI*t/23)':shortest=1[b1];
[b1][g2]overlay=x='-620+120*cos(2*PI*t/21)':y='980+140*sin(2*PI*t/17)':shortest=1[b2];
[0:v]crop=594:1288:243:330,scale=531:1151:flags=lanczos,format=rgba[scr];
[5:v]format=gray,trim=duration=52.1[m];[scr][m]alphamerge[scrm];
[b2][scrm]overlay=274.5:448:shortest=1[b3];
[4:v]format=rgba[fr];[b3][fr]overlay=0:0:shortest=1[base];
$CAPS
${CHAIN},format=yuv420p[out]" -map "[out]" -t 52.1 -r 30 -c:v libx264 -preset slow -crf 18 -movflags +faststart "$OUT"
