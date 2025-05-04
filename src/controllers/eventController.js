const Event = require('../models/Event');

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ date: 1 })
      .populate('createdBy', 'name walletAddress');
    
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('createdBy', 'name walletAddress')
      .populate('participants', 'name walletAddress');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.status(200).json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, location, date, activityType, capacity } = req.body;
    
    if (!title || !description || !location || !date || !activityType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const newEvent = new Event({
      title,
      description,
      location,
      date: new Date(date),
      activityType,
      capacity: capacity || 0,
      createdBy: req.user.userId
    });
    
    await newEvent.save();
    
    res.status(201).json({
      message: 'Event created successfully',
      event: newEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { title, description, location, date, activityType, capacity } = req.body;
    
    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (location) updates.location = location;
    if (date) updates.date = new Date(date);
    if (activityType) updates.activityType = activityType;
    if (capacity !== undefined) updates.capacity = capacity;
    
    const event = await Event.findByIdAndUpdate(
      req.params.eventId,
      { $set: updates },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.status(200).json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    await event.remove();
    
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.joinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ message: 'Cannot join past events' });
    }
    
    if (event.capacity > 0 && event.participants.length >= event.capacity) {
      return res.status(400).json({ message: 'Event is at full capacity' });
    }
    
    if (event.participants.includes(req.user.userId)) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }
    
    event.participants.push(req.user.userId);
    await event.save();
    
    res.status(200).json({ 
      message: 'Successfully joined event',
      event
    });
  } catch (error) {
    console.error('Error joining event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.leaveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ message: 'Cannot leave past events' });
    }
    
    if (!event.participants.includes(req.user.userId)) {
      return res.status(400).json({ message: 'You are not registered for this event' });
    }
    
    event.participants = event.participants.filter(
      participant => participant.toString() !== req.user.userId
    );
    await event.save();
    
    res.status(200).json({ 
      message: 'Successfully left event',
      event
    });
  } catch (error) {
    console.error('Error leaving event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};