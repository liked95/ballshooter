if (player.buff === 'Automatic' && mouse.down) {
    if (frame % 5 === 0){
        player.shoot(mouse, '#FFF500');
    }
}

buffs.forEach((buff, index) => {
    const dist = Math.hypot(player.x - buff.x, player.y - buff.y);

    // if power up go out of canvas
    // if enemies go out of the canvas
    if (buff.x - buff.width/2 > canvas.width + 50 ||
        buff.x + buff.height/2 < 0 - 50 ||
        buff.y - buff.width/2 > canvas.height + 50||
        buff.y + buff.height/2 < 0 - 50) {
            buffs.splice(index, 1);
        }
    
    // if player got the power up
    if (dist < player.radius + buff.width/2){
        obtainbuffAudio.cloneNode().play();
        player.color = '#FFF500';
        player.buff = 'Automatic';
        buffs.splice(index, 1);

        setTimeout(() => {
            player.buff = null;
            player.color = '#FFFFFF'
        }, 10000)
    } else {
        buff.update()
    }
})
